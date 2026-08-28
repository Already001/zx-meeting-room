<template>
  <DemoHomePage v-if="!signedIn" />
  <BookingBoardPage v-else />
</template>
<script setup>
import BookingBoardPage from "@/features/booking/BookingBoardPage.vue";
import DemoHomePage from "@/features/demo/DemoHomePage.vue";
import { currentHasDemoIdentity } from "@/features/demo/session";

const signedIn = currentHasDemoIdentity();
</script>
