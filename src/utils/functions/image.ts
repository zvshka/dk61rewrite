import { Database } from '@/services'
import { resolveDependency } from '@/utils/functions'

/**
 * Abstraction level for the image repository that will find an image by its name (with or without extension).
 * @param imageName
 * @returns image url
 */
export async function getImage(imageName: string): Promise<string | null> {
	const db = await resolveDependency(Database)

	const image = await db.prisma.image.findFirst({
		where: {
			OR: [
				{ filename: imageName },
				{ filename: `${imageName}.png` },
				{ filename: `${imageName}.jpg` },
				{ filename: `${imageName}.jpeg` },
				{ filename: `${imageName}.gif` },
			],
		},
	})

	return image?.url || null
}
