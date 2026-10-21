<template>
	<ProjectWrapper
		class="project-week"
		:is-loading-project="isLoadingProject"
		:project-id
		:view-id
	>
		<template #default>
			<div
				class="project-week__weeks loader-container"
				:class="{'is-loading': isLoading}"
			>
				<template
					v-for="(week, index) in weeks"
					:key="week.key"
				>
					<h2
						v-if="index === 0 || index === 1"
						class="project-week__heading"
					>
						{{ index === 0 ? $t('project.week.current') : $t('project.week.following') }}
					</h2>
					<div class="project-week__sheet">
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
										v-for="day in week.days"
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
										v-for="cell in cellsFor(user.id, week.days)"
										:key="`${user.id}-${cell.key}`"
										class="project-week__cell"
										:class="{
											'project-week__cell--today': coversToday(cell, week.days),
											'project-week__cell--task': cell.task,
										}"
										:colspan="cell.colspan"
									>
										<button
											v-if="cell.task"
											type="button"
											class="project-week__task"
											:title="cell.task.title"
											@click="openTask(cell.task.id)"
										>
											{{ cell.task.title }}
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</template>
			</div>
		</template>
	</ProjectWrapper>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useQuery} from '@tanstack/vue-query'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'

import ProjectWrapper from '@/components/project/ProjectWrapper.vue'

import {useAuthStore} from '@/stores/auth'
import {useGlobalNow} from '@/composables/useGlobalNow'
import {allTasksQuery} from '@/client/queries/tasks'
import {weekUsersQuery} from '@/client/queries/weekUsers'
import {weekBarCells, type WeekBarCell} from '@/helpers/project/weekTaskBars'
import {weekDates} from '@/helpers/time/calendarGrid'
import {isSameDay} from '@/helpers/time/dateMath'
import {formatDate} from '@/helpers/time/formatDate'

type WeekDay = {
	date: Date,
	key: string,
	label: string,
	title: string,
	isToday: boolean,
}

const props = defineProps<{
	isLoadingProject: boolean,
	projectId: number,
	viewId: number,
}>()

const WEEK_COUNT = 4

const {locale} = useI18n({useScope: 'global'})
const router = useRouter()
const authStore = useAuthStore()
const {now} = useGlobalNow()

function openTask(taskId: number) {
	router.push({
		name: 'task.detail',
		params: {id: taskId},
		state: {backdropView: router.currentRoute.value.fullPath},
	})
}

const usersQuery = useQuery(computed(() => weekUsersQuery(
	props.projectId,
	props.projectId > 0,
)))

const tasksQuery = useQuery(computed(() => ({
	...allTasksQuery({
		project: props.projectId,
		params: {
			sort_by: ['start_date', 'id'],
			order_by: ['asc', 'asc'],
		},
	}),
	enabled: props.projectId > 0,
})))

const users = computed(() => usersQuery.data.value ?? [])
const tasks = computed(() => tasksQuery.data.value ?? [])
const isLoading = computed(() => usersQuery.isLoading.value || tasksQuery.isLoading.value)

const weeks = computed(() => {
	const weekStart = authStore.settings.week_start ?? 0

	return Array.from({length: WEEK_COUNT}, (_, offset) => {
		const days = weekDates(now.value, weekStart, offset).map(date => ({
			date,
			key: `${locale.value}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
			label: formatDate(date, 'D MMM'),
			title: formatDate(date, 'dddd D MMMM'),
			isToday: isSameDay(date, now.value),
		}))

		return {key: days[0].key, days}
	})
})

function cellsFor(userId: number, days: WeekDay[]) {
	return weekBarCells(days.map(day => day.date), tasks.value, userId)
}

function coversToday(cell: WeekBarCell, days: WeekDay[]) {
	return days
		.slice(cell.startsOn, cell.startsOn + cell.colspan)
		.some(day => day.isToday)
}
</script>

<style lang="scss" scoped>
.project-week__weeks {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.project-week__heading {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 700;
	line-height: 1.2;
}

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

	&--task {
		padding: .35rem;
	}
}

.project-week__task {
	display: block;
	inline-size: 100%;
	overflow: hidden;
	padding: .25rem .6rem;
	border: 0;
	border-radius: $radius;
	background: var(--primary);
	color: var(--primary-invert);
	font: inherit;
	font-weight: 600;
	line-height: 1.4;
	text-align: start;
	text-overflow: ellipsis;
	white-space: nowrap;
	cursor: pointer;
}
</style>
