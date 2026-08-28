<template>
  <DemoHomePage v-if="!signedIn" />
  <MobileBookingPage v-else />
</template>
<script setup>
import MobileBookingPage from "@/features/booking/MobileBookingPage.vue";
import DemoHomePage from "@/features/demo/DemoHomePage.vue";
import { currentHasDemoIdentity } from "@/features/demo/session";

const signedIn = currentHasDemoIdentity();
</script>
