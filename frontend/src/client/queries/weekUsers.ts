import {queryOptions} from '@tanstack/vue-query'
import {projectsUsersSearch} from '@/client/generated'
import {getDisplayName} from '@/helpers/user'

export type WeekUser = {
	id: number,
	name: string,
}

type NamedUser = {
	id?: number,
	name?: string,
	username?: string,
	bot_owner_id?: number,
	is_admin?: boolean | null,
}

export const weekUserKeys = {
	project: (projectId: number) => ['week-users', 'project', projectId] as const,
}

function toWeekUsers(users: NamedUser[]): WeekUser[] {
	return users.flatMap(user => {
		if (!user.id || (user.bot_owner_id ?? 0) > 0 || user.is_admin) {
			return []
		}

		return [{
			id: user.id,
			name: getDisplayName(user),
		}]
	}).sort((a, b) => a.name.localeCompare(b.name))
}

export function weekUsersQuery(projectId: number, enabled: boolean) {
	return queryOptions({
		queryKey: weekUserKeys.project(projectId),
		enabled,
		queryFn: async ({signal}): Promise<WeekUser[]> => {
			const {data} = await projectsUsersSearch({
				path: {project: projectId},
				query: {q: '', exclude_admins: true},
				signal,
			})
			return toWeekUsers(data.items ?? [])
		},
	})
}
