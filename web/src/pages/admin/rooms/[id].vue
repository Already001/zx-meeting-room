<template>
  <RoomFormPage :id="route.params.id" />
</template>

<script setup>
import { useRoute } from "vue-router";
import RoomFormPage from "@/features/admin/RoomFormPage.vue";

const route = useRoute();
</script>
