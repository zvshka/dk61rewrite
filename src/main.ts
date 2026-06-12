import 'reflect-metadata';
import 'dotenv/config';

import process from 'node:process';

import { resolve } from '@discordx/importer';
import chalk from 'chalk';
import chokidar from 'chokidar';
import discordLogs from 'discord-logs';
import { Client, DIService, MetadataStorage, tsyringeDependencyRegistryEngine } from 'discordx';
import { container } from 'tsyringe';
import { constructor } from 'tsyringe/dist/typings/types';

import { Server } from '@/api/server';
import { apiConfig, generalConfig } from '@/configs';
import { keptInstances } from '@/decorators';
import { checkEnvironmentVariables, env } from '@/env';
import { NoBotTokenError } from '@/errors';
import {
  Database,
  ErrorHandler,
  EventManager,
  ImagesUpload,
  Logger,
  PluginsManager,
  Store,
} from '@/services';
import { initDataTable, isNullOrWhitespace, resolveDependency } from '@/utils/functions';

import { clientConfig } from './client';

const importPattern = `${__dirname}/{events,commands}/**/*.{ts,js}`;

async function loadFiles(path: string): Promise<void> {
  const files = await resolve(path);
  await Promise.all(
    files.map(file => {
      const newFileName = file.replace('file://', '');
      delete require.cache[newFileName];
      return import(newFileName);
    })
  );
}

async function reload(client: Client) {
  const store = await resolveDependency(Store);
  store.set('botHasBeenReloaded', true);

  const logger = await resolveDependency(Logger);
  console.log('\n');
  logger.startSpinner('Hot reloading...');

  client.removeEvents();

  const instancesToKeep: Map<constructor<any>, any> = new Map();
  for (const target of keptInstances) {
    const instance = await resolveDependency(target);
    instancesToKeep.set(target, instance);
  }

  MetadataStorage.clear();
  DIService.engine.clearAllServices();

  for (const [target, instance] of instancesToKeep) container.registerInstance(target, instance);
  container.registerInstance(Client, client);

  await loadFiles(importPattern);

  await MetadataStorage.instance.build();
  await client.initApplicationCommands();
  client.initEvents();

  const pluginManager = await resolveDependency(PluginsManager);
  await pluginManager.loadPlugins();

  const db = await resolveDependency(Database);
  await db.initialize();

  logger.log(chalk.whiteBright('Hot reloaded\n'));
}

async function init() {
  const logger = await resolveDependency(Logger);

  checkEnvironmentVariables();

  await resolveDependency(ErrorHandler);

  const pluginManager = await resolveDependency(PluginsManager);
  await pluginManager.loadPlugins();
  await pluginManager.syncTranslations();

  console.log('\n');
  logger.startSpinner('Starting...');

  const db = await resolveDependency(Database);
  await db.initialize();

  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
  const client = new Client(clientConfig());

  await discordLogs(client, { debug: false });
  container.registerInstance(Client, client);

  await loadFiles(importPattern);

  await initDataTable(db);

  pluginManager.initServices();
  pluginManager.execMains();

  if (!env.BOT_TOKEN) throw new NoBotTokenError();

  const watcher = env.NODE_ENV === 'development' ? chokidar.watch(importPattern) : null;

  client
    .login(env.BOT_TOKEN)
    .then(async () => {
      if (env.NODE_ENV === 'development') {
        logger.log('[DEV] ⚠️⚠️⚠️ Dev mode enabled ⚠️⚠️⚠️')

        watcher?.on('change', () => reload(client));
        watcher?.on('add', () => reload(client));
        watcher?.on('unlink', () => reload(client));
      }

      if (apiConfig.enabled) {
        const server = await resolveDependency(Server);
        await server.start();
      }

      if (!isNullOrWhitespace(env.IMGUR_CLIENT_ID) && generalConfig.automaticUploadImagesToImgur) {
        const imagesUpload = await resolveDependency(ImagesUpload);
        await imagesUpload.syncWithDatabase();
      }

      const store = container.resolve(Store);
      store.select('ready').subscribe(async ready => {
        if (
          Object.values(ready)
            .filter(value => value !== null)
            .every(value => value)
        ) {
          const eventManager = await resolveDependency(EventManager);
          await eventManager.emit('templateReady');
        }
      });
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

init().catch(err => {
  console.error(err);
});
