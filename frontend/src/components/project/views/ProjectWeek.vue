<template>
	<ProjectWrapper
		class="project-week"
		:is-loading-project="isLoadingProject"
		:project-id
		:view-id
	/>
</template>

<script setup lang="ts">
import ProjectWrapper from '@/components/project/ProjectWrapper.vue'

defineProps<{
	isLoadingProject: boolean,
	projectId: number,
	viewId: number,
}>()
</script>
