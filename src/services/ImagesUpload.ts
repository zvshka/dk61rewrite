import path from 'node:path'
import { promisify } from 'node:util'

import axios from 'axios'
import chalk from 'chalk'
import { imageHash as callbackImageHash } from 'image-hash'
import { ImgurClient } from 'imgur'

import { Service } from '@/decorators'
import { env } from '@/env'
import { Database, Logger } from '@/services'
import { base64Encode, fileOrDirectoryExists, getFiles } from '@/utils/functions'

import { Image } from '../generated/prisma/client'

const imageHasher = promisify(callbackImageHash)

@Service()
export class ImagesUpload {

	private validImageExtensions = ['.png', '.jpg', '.jpeg']
	private imageFolderPath = path.join(__dirname, '..', '..', 'assets', 'images')

	private imgurClient: ImgurClient | null = env.IMGUR_CLIENT_ID
		? new ImgurClient({
			clientId: env.IMGUR_CLIENT_ID,
		})
		: null

	constructor(
		private db: Database,
		private logger: Logger
	) {
	}

	isValidImageFormat(file: string): boolean {
		for (const extension of this.validImageExtensions) {
			if (file.endsWith(extension))
				return true
		}

		return false
	}

	async syncWithDatabase() {
		if (!fileOrDirectoryExists(this.imageFolderPath))
			this.logger.log('Image folder does not exist, couldn\'t sync with database', 'warn')

		// get all images inside the assets/images folder
		const images = getFiles(this.imageFolderPath)
			.filter(file => this.isValidImageFormat(file))
			.map(file => file.replace(`${this.imageFolderPath}/`, ''))

		// remove all images from the database that are not anymore in the filesystem
		const imagesInDb = await this.db.prisma.image.findMany()

		for (const image of imagesInDb) {
			const imagePath = `${image.basePath !== '' ? `${image.basePath}/` : ''}${image.filename}`

			// delete the image if it is not in the filesystem anymore
			if (!images.includes(imagePath)) {
				await this.db.prisma.image.delete({
					where: {
						id: image.id,
					},
				})
				await this.deleteImageFromImgur(image)
			} else if (!await this.isImgurImageValid(image.url)) {
				// reupload if the image is not on imgur anymore
				await this.addNewImageToImgur(imagePath, image.hash, true)
			}
		}

		// check if the image is already in the database and that its md5 hash is the same.
		for (const imagePath of images) {
			const imageHash = await imageHasher(
                `${this.imageFolderPath}/${imagePath}`,
                16,
                true
			) as string

			const imageInDb = await this.db.prisma.image.findFirst({
				where: {
					hash: imageHash,
				},
			})

			if (!imageInDb)
				await this.addNewImageToImgur(imagePath, imageHash)
			else if (
				imageInDb && (
					imageInDb.basePath !== imagePath.split('/').slice(0, -1).join('/')
					|| imageInDb.filename !== imagePath.split('/').slice(-1)[0])
			) console.warn(`Image ${chalk.bold.green(imagePath)} has the same hash as ${chalk.bold.green(imageInDb.basePath + (imageInDb.basePath?.length ? '/' : '') + imageInDb.filename)} so it will skip`)
		}
	}

	async deleteImageFromImgur(image: Image) {
		if (!this.imgurClient)
			return

		await this.imgurClient.deleteImage(image.deleteHash)

		this.logger.log(
            `Image ${image.filename} deleted from database because it is not in the filesystem anymore`,
            'info',
            true
		)
	}

	async addNewImageToImgur(imagePath: string, imageHash: string, _reupload: boolean = false) {
		if (!this.imgurClient)
			return

		// upload the image to imgur
		const base64 = base64Encode(`${this.imageFolderPath}/${imagePath}`)

		try {
			const imageFileName = imagePath.split('/').slice(-1)[0]
			const imageBasePath = imagePath.split('/').slice(0, -1).join('/')

			const uploadResponse = await this.imgurClient.upload({
				image: base64,
				type: 'base64',
				name: imageFileName,
			})

			if (!uploadResponse.success) {
				this.logger.log(
                    `Error uploading image ${imageFileName} to imgur: ${uploadResponse.status} ${uploadResponse.data}`,
                    'error',
                    true
				)

				return
			}

			// add the image to the database
			await this.db.prisma.image.create({
				data: {
					filename: imageFileName,
					basePath: imageBasePath,
					url: uploadResponse.data.link,
					size: uploadResponse.data.size,
					tags: imageBasePath.split('/'),
					hash: imageHash,
					deleteHash: uploadResponse.data.deletehash || '',
				},
			})

			// log the success
			this.logger.log(
                `Image ${chalk.bold.green(imagePath)} uploaded to imgur`,
                'info',
                true
			)
		} catch (error: any) {
			this.logger.log(error?.toString(), 'error', true)
		}
	}

	async isImgurImageValid(imageUrl: string): Promise<boolean> {
		if (!this.imgurClient)
			return false

		const res = await axios.get(imageUrl)

		return !res.request?.path.includes('/removed')
	}

}
