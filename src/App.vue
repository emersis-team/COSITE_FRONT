<template>
  <div id="app">
    <Snackbar></Snackbar>
    <router-view />
  </div>
</template>

<script>
import Vue from "vue";
import Snackbar from "@/components/Snackbar.vue";

export default {
  data() {
    return {
      deferredPrompt: null
    };
  },
  components: { Snackbar },
  created() {
    Vue.prototype.$localurl = "http://38.109.228.250:8081/COSITE_BACK/public";
    // Vue.prototype.$localurl = "http://localhost/COSITE_BACK/public";
    
    this.$axios.defaults.headers.common["Authorization"] =
      "Bearer " + localStorage.getItem("$token");
    if (localStorage.getItem("$token") == null) {
      this.$router.push("/login");
    }

    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
    });
    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
    });
  },
  mounted() {},
  methods: {
    async dismiss() {
      this.deferredPrompt = null;
    },
    async install() {
      this.deferredPrompt.prompt();
    }
  }
};
</script>

<style src="@/assets/css/fonts.css"></style>
<style src="@/assets/css/transitions.css"></style>
<style src="@/assets/css/app.css"></style>
<style src="@/assets/css/error.css"></style>
<style src="@/assets/css/components/loading.css"></style>
