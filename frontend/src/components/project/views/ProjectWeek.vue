<template>
	<ProjectWrapper
		class="project-week"
		:is-loading-project="isLoadingProject"
		:project-id
		:view-id
	>
		<template #default>
			<div
				class="project-week__sheet loader-container"
				:class="{'is-loading': usersQuery.isLoading}"
			>
				<table class="project-week__table">
					<thead>
						<tr>
							<th
								class="project-week__user project-week__user--header"
								scope="col"
							>
								<span class="is-sr-only">{{ $t('misc.user') }}</span>
							</th>
							<th
								v-for="day in days"
								:key="day.key"
								class="project-week__day"
								:class="{'project-week__day--today': day.isToday}"
								scope="col"
								:title="day.title"
							>
								{{ day.label }}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="user in users"
							:key="user.id"
						>
							<th
								class="project-week__user"
								scope="row"
							>
								{{ user.name }}
							</th>
							<td
								v-for="day in days"
								:key="`${user.id}-${day.key}`"
								class="project-week__cell"
								:class="{'project-week__cell--today': day.isToday}"
							/>
						</tr>
					</tbody>
				</table>
			</div>
		</template>
	</ProjectWrapper>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useQuery} from '@tanstack/vue-query'
import {useI18n} from 'vue-i18n'

import ProjectWrapper from '@/components/project/ProjectWrapper.vue'

import {useAuthStore} from '@/stores/auth'
import {useGlobalNow} from '@/composables/useGlobalNow'
import {weekUsersQuery} from '@/client/queries/weekUsers'
import {currentWeekDates} from '@/helpers/time/calendarGrid'
import {isSameDay} from '@/helpers/time/dateMath'
import {formatDate} from '@/helpers/time/formatDate'

const props = defineProps<{
	isLoadingProject: boolean,
	projectId: number,
	viewId: number,
}>()

const {locale} = useI18n({useScope: 'global'})
const authStore = useAuthStore()
const {now} = useGlobalNow()

const usersQuery = useQuery(computed(() => weekUsersQuery(
	props.projectId,
	props.projectId > 0,
)))

const users = computed(() => usersQuery.data.value ?? [])

const days = computed(() => {
	const weekStart = authStore.settings.week_start ?? 0

	return currentWeekDates(now.value, weekStart).map(date => ({
		key: `${locale.value}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
		label: formatDate(date, 'D MMM'),
		title: formatDate(date, 'dddd D MMMM'),
		isToday: isSameDay(date, now.value),
	}))
})
</script>

<style lang="scss" scoped>
.project-week__sheet {
	overflow: auto;
	background: var(--white);
	border-radius: $radius;
	box-shadow: var(--shadow-sm);
}

.project-week__table {
	border-collapse: separate;
	border-spacing: 0;
	border-block-start: 1px solid var(--grey-200);
	border-inline-start: 1px solid var(--grey-200);
	inline-size: 100%;
	font-size: .875rem;

	th,
	td {
		border-block-end: 1px solid var(--grey-200);
		border-inline-end: 1px solid var(--grey-200);
		padding: .5rem .75rem;
		background: var(--white);
	}
}

.project-week__user {
	position: sticky;
	inset-inline-start: 0;
	z-index: 1;
	min-inline-size: 10rem;
	text-align: start;
	font-weight: 600;
	white-space: nowrap;

	&--header {
		inset-block-start: 0;
		z-index: 2;
	}
}

.project-week__day {
	position: sticky;
	inset-block-start: 0;
	z-index: 1;
	min-inline-size: 5.5rem;
	text-align: center;
	font-weight: 600;
	white-space: nowrap;
	background: var(--grey-100);

	&--today {
		background: var(--grey-200);
	}
}

.project-week__cell {
	block-size: 2.75rem;

	&--today {
		background: var(--grey-100);
	}
}
</style>
