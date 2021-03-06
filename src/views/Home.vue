<template>
  <div class="home">
    <div class="home-body">
      <div class="home-left">
        <div>
          <input
            class="home-buscar"
            type="text"
            placeholder="Buscar"
            @keyup="buscar()"
            ref="inputBuscar"
          />
          <img class="home-buscar-img" src="../assets/img/buscar.png" />
        </div>
        <div class="home-left-conversaciones">
          <div
            v-for="(conversacion, index) in conversacionesFiltradas"
            :key="index"
            @click="elegirConversacion(conversacion)"
            v-bind:class="{
              'home-conversacion-elegida': conversacion == conversacionElegida
            }"
          >
            <Conversacion :conversacion="conversacion"></Conversacion>
          </div>
        </div>
        <button class="home-logout" @click="logout()">Cerrar sesión</button>
      </div>
      <div class="home-right" :class="{ 'home-right-with-map': conversacionElegida != null }">
        <Chat
          v-if="conversacionElegida != null"
          :conversacion="conversacionElegida"
        ></Chat>
        <Mapa :conversaciones="conversacionesFiltradas"></Mapa>
      </div>
    </div>
  </div>
</template>

<script>
import Conversacion from "@/components/Conversacion.vue";
import Chat from "@/components/Chat.vue";
import Vue from "vue";
import Echo from "laravel-echo";
import Mapa from "@/components/Mapa.vue";

window.Pusher = require("pusher-js");

export default {
  name: "Home",
  components: {
    Conversacion,
    Chat,
    Mapa
  },
  data() {
    return {
      conversacionElegida: null,
      conversacionesFiltradas: [],
      conversaciones: [],
      mensajes: []
    };
  },
  created() {
    this.$eventHub.$on("home-desconectar-socket", this.desconectarSocket());
    this.$eventHub.$on("loged", () => this.reportarUbicacion());
  },
  mounted() {
    this.getConversaciones();
    this.conectarSocket();
    this.conversacionesFiltradas = this.conversaciones;
    this.reportarUbicacion();
  },
  beforeDestroy() {
    this.$eventHub.$off("home-desconectar-socket");
  },
  methods: {
    conectarSocket(){
      if(localStorage.getItem("$userId") != null){
        try {
          var that = this;
          window.Echo = new Echo({
            broadcaster: "pusher",
            key: "ASDASD2121",
            wsHost: "38.109.228.250",
            wsPort: 6001,
          // wssPort: 6001,
            disableStats: true,
            forceTLS: false,
            enabledTransports: ["ws"]
          });
          console.log("Conectando al websocket canal: " + "user."+localStorage.getItem("$userId"));
          window.Echo.channel("user."+localStorage.getItem("$userId")).listen("NewMessage", (e) => {
            console.log("Recibo mensaje por websocket");
            console.log(e);
            that.$eventHub.$emit("chat-get");
            that.getConversaciones();
          });
          window.Echo.channel("user."+localStorage.getItem("$userId")).listen("NewPositionEvent", (e) => {
            console.log("Recibo mensaje de posición");
            console.log(e);
            that.getConversaciones();
          });
        } catch (error) {
          console.log(error);
        }
        
      }
    },
    desconectarSocket(){
      if(window.Echo != null){
        window.Echo.channel("user."+localStorage.getItem("$userId")).stopListening('NewMessage');
      }
    },
    getConversaciones() {
      var that = this;
      this.$axios
        .get(this.$localurl + "/api/v1/messages")
        .then(function(response) {
          that.conversaciones = response.data.conversations;
          that.conversacionesFiltradas = that.conversaciones;
        })
        .catch(function(response) {
          if (response.response.status == 401) {
            that.desconectarSocket();
            localStorage.removeItem("$expire");
            if(window.location.pathname.split("/").reverse()[0] != "login"){
              that.$router.push("/login");
            }
          }
        });
    },
    buscar() {
      var inputBuscar = this.$refs.inputBuscar.value.toUpperCase();
      this.conversacionesFiltradas = this.conversaciones.filter(
        c =>
          c.user_dest.name.toUpperCase().indexOf(inputBuscar) > -1 ||
          c.user_dest.email.toUpperCase().indexOf(inputBuscar) > -1
      );
    },
    elegirConversacion(conversacion) {
      if(conversacion != this.conversacionElegida){
        conversacion.ammount_no_read = 0;
        this.conversacionElegida = conversacion;
        Vue.prototype.$conversacionElegida = conversacion;
  
        this.$eventHub.$emit("chat-get", conversacion.id);

        this.$eventHub.$emit("map-center", [parseFloat(conversacion.user_dest.last_position.lat), parseFloat(conversacion.user_dest.last_position.lon)]);
      }else{
        Vue.prototype.$conversacionElegida = null;
        this.conversacionElegida = null;
        this.$eventHub.$emit("map-center-propia");
      }
    },
    logout() {
      this.desconectarSocket();
      var that = this;
      this.$axios
        .post(this.$localurl + "/api/v1/auth/logout")
        .then(function() {
          that.desconectarSocket();
          localStorage.removeItem("$token");
          localStorage.removeItem("$userId");
          localStorage.removeItem("$expire");
          if(window.location.pathname.split("/").reverse()[0] != "login"){
              that.$router.push("/login");
            }
        })
        .catch(function(error) {
          // handle error
          console.log(error);
        });
    },
    reportarUbicacion(){
      var that = this;
      navigator.geolocation.getCurrentPosition(function(position) {
        console.log("reporto ubicacion: " + position);
        setTimeout(function(){
          that.reportarUbicacion();
        }, 60000);
        var posicion = new FormData();
        posicion.append("lat", position.coords.latitude);
        posicion.append("lon", position.coords.longitude);
        posicion.append("alt", (position.coords.altitude != null ? position.coords.altitude : 0));
        that.$axios
          .post(that.$localurl + "/api/v1/position/user_position", posicion)
          .then(function(response) {
            console.log(response);
          })
          .catch(function(response) {
            console.log(response);
          });
      });
    }
  }
};
</script>

<style scoped src="../assets/css/views/home.css"></style>
