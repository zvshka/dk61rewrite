// // ===========================================
// // =========== Custom Repository =============
// // ===========================================
//
// export class UserRepository {
//
// 	async updateLastInteract(userId?: string): Promise<void> {
// 		const user = await this.findOne({ id: userId })
//
// 		if (user) {
// 			user.lastInteract = new Date()
// 			await this.em.flush()
// 		}
// 	}
//
// }
