<template>
  <div class="chat">
    <div class="chat-top">
      <p>Conversación con 
        {{
          $conversacionElegida != null
            ? $conversacionElegida.user_dest.name
            : ""
        }}
      </p>
    </div>
    <div class="chat-scroll-container">
      <div
        id="chatScroll"
        class="chat-scroll"
        ref="chatScroll"
        @scroll="onScroll"
      >
        <div
          v-for="mensaje in mensajes"
          :key="mensaje.id"
          :id="mensaje.id"
          class="chat-container"
          v-bind:class="{ 'chat-mensaje-propio': mensaje.sender_id == userId }"
        >
        <div v-if="mensaje.fecha != null" class="chat-separador">
          <label>{{mensaje.fecha}}</label>
        </div>
        <div v-if="mensaje.fecha == null">
            <span class="chat-tail" v-if="mensaje.sender_id != userId">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 8 13"
                width="8"
                height="13"
                style="display: block;"
              >
                <path
                  opacity=".13"
                  fill="#0000000"
                  d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"
                />
                <path
                  fill="currentColor"
                  d="M1.533 2.568L8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"
                />
              </svg>
            </span>
            <span class="chat-tail-out" v-if="mensaje.sender_id == userId">
              <svg
                class="chat-tail-svg"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 8 13"
                width="8"
                height="13"
                style="display: block;"
              >
                <path
                  opacity=".13"
                  d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
                />
                <path
                  fill="currentColor"
                  d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"
                />
              </svg>
            </span>
            <MensajeTexto
              v-if="
                mensaje.message_type != null &&
                  mensaje.message_type.substr(11, 100) == 'TextMessage'
              "
              :mensaje="mensaje"
              :mensajePropio="mensaje.sender_id == userId"
            ></MensajeTexto>
            <MensajePosicion
              v-if="
                mensaje.message_type != null &&
                  mensaje.message_type.substr(11, 100) == 'PositionMessage'
              "
              :mensaje="mensaje"
              :mensajePropio="mensaje.sender_id == userId"
            ></MensajePosicion>
            <MensajeArchivo
              v-if="
                mensaje.message_type != null &&
                  mensaje.message_type.substr(11, 100) == 'FileMessage' &&
                  esArchivo(mensaje)
              "
              :mensaje="mensaje"
              :mensajePropio="mensaje.sender_id == userId"
            ></MensajeArchivo>
            <MensajeImagen
              v-if="
                mensaje.message_type != null &&
                  mensaje.message_type.substr(11, 100) == 'FileMessage' &&
                  esImagen(mensaje)
              "
              :mensaje="mensaje"
              :mensajePropio="mensaje.sender_id == userId"
            ></MensajeImagen>
            <MensajeVideo
              v-if="
                mensaje.message_type != null &&
                  mensaje.message_type.substr(11, 100) == 'FileMessage' &&
                  esVideo(mensaje)
              "
              :mensaje="mensaje"
              :mensajePropio="mensaje.sender_id == userId"
            ></MensajeVideo>
            <MensajeAudio
              v-if="
                mensaje.message_type != null &&
                  mensaje.message_type.substr(11, 100) == 'FileMessage' &&
                  esAudio(mensaje)
              "
              :mensaje="mensaje"
              :mensajePropio="mensaje.sender_id == userId"
            ></MensajeAudio>
        </div>
        </div>
      </div>
    </div>
    <div class="chat-bottom">
      <div class="chat-adjuntar" title="Adjuntar" @click="mostrarOpciones = true">
        <img src="../assets/img/adjuntar.png"/>
      </div>
      <input
        type="text"
        placeholder="Escribe un mensaje aquí"
        ref="inputTexto"
        v-on:keyup.enter="enviar()"
        maxlength="140"
      />
      <img v-show="!enviando" class="chat-enviar" src="../assets/img/enviar.png" @click="enviar()"/>
      <img v-show="enviando" class="chat-enviar" style="opacity: 0.5;" src="../assets/img/enviar.png"/>
    </div>
    <Loading v-show="mostrarLoading"></Loading>
    <div v-show="mostrarOpciones" class="chat-opciones">
      <div class="chat-opciones-mask" @click="mostrarOpciones = false"></div>
      <div class="chat-opciones-container">
        <div>
          <input
            type="file"
            class="app-hide"
            @change="changeAdjunto()"
            ref="adjuntoFiles"
            multiple
          />
          <img class="chat-opciones-img" src="../assets/img/adjuntar.png" @click="adjuntar()"/>
        </div>
        <div>
          <img class="chat-opciones-img" src="../assets/img/ubicacion.png" @click="enviarPosicion()"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MensajeTexto from "@/components/MensajeTexto.vue";
import MensajePosicion from "@/components/MensajePosicion.vue";
import MensajeArchivo from "@/components/MensajeArchivo.vue";
import MensajeImagen from "@/components/MensajeImagen.vue";
import MensajeVideo from "@/components/MensajeVideo.vue";
import MensajeAudio from "@/components/MensajeAudio.vue";
import Loading from "@/components/Loading.vue";

export default {
  name: "Chat",
  components: {
    MensajeTexto,
    MensajeArchivo,
    MensajeImagen,
    MensajeVideo,
    MensajeAudio,
    MensajePosicion,
    Loading
  },
  data() {
    return {
      mensajes: [],
      userId: null,
      primeraPagina: true,
      currentPage: 0,
      lastPage: 0,
      mensajeOffset: null,
      mostrarLoading: false,
      mostrarOpciones: false,
      enviando: false
    };
  },
  props: { conversacion: [Object] },
  computed: {},
  mounted() {
    this.mostrarLoading = true;
    this.userId = localStorage.getItem("$userId");
    this.mensajes = [];
    this.getChat();
    this.mostrarLoading = false;
    this.$refs.chatScroll.addEventListener("touchmove", this.onScroll);
  },
  created() {
    this.$eventHub.$on("chat-get", id => this.onGetChat(id));
  },
  methods: {
    esImagen(mensaje) {
      var extension = mensaje.message.files[0].file
        .split(".")
        [mensaje.message.files[0].file.split(".").length - 1].toLowerCase();
      if (
        extension == "png" ||
        extension == "jpg" ||
        extension == "svg" ||
        extension == "jpeg"
      ) {
        return true;
      } else {
        return false;
      }
    },
    esVideo(mensaje) {
      var extension = mensaje.message.files[0].file
        .split(".")
        [mensaje.message.files[0].file.split(".").length - 1].toLowerCase();
      if (
        extension == "webm" ||
        extension == "mkv" ||
        extension == "flv" ||
        extension == "mp4" ||
        extension == "mov" ||
        extension == "avi"
      ) {
        return true;
      } else {
        return false;
      }
    },
    esAudio(mensaje) {
      var extension = mensaje.message.files[0].file
        .split(".")
        [mensaje.message.files[0].file.split(".").length - 1].toLowerCase();
      if (extension == "m4a" || extension == "qt" || extension == "4mb") {
        return true;
      } else {
        return false;
      }
    },
    esArchivo(mensaje) {
      if (
        this.esImagen(mensaje) == false &&
        this.esVideo(mensaje) == false &&
        this.esAudio(mensaje) == false
      ) {
        return true;
      } else {
        return false;
      }
    },
    onGetChat(id) {
      if (id != null) {
        this.mostrarLoading = true;
      }
      this.getChat(id);
      this.$forceUpdate();
    },
    getChat(id) {
      if (id == null) {
        id = this.conversacion.id;
      } else {
        this.mensajes = [];
        this.primeraPagina = true;
      }
      var that = this;
      this.$axios
        .get(this.$localurl + "/api/v1/messages/" + id)
        .then(function(response) {
          that.mostrarLoading = false;
          if (
            that.primeraPagina == true &&
            !that.isOverflown(document.getElementById("chatScroll"))
          ) {
            that.primeraPagina = false;
            that.getChatPage(2);
          }
          var scrollear = false;
          that.lastPage = response.data.messages.last_page;
          response.data.messages.data.reverse();
          response.data.messages.data.forEach(m => {
            if (
              !that.mensajes.some(mensaje => mensaje.id == m.id) &&
              m.conversation_id == that.conversacion.id
            ) {
              that.mensajes.push(m);
              scrollear = true;
            }
          });
          if (scrollear == true) {
            that.mensajeOffset = that.mensajes[that.mensajes.length - 1];
          }
          that.getSeparadores();
        })
        .catch(function(response) {
          that.mostrarLoading = false;
          if (
            response != null &&
            response.response != null &&
            response.response.status == 401
          ) {
            console.log("desconecto socket");
            that.$eventHub.$emit("home-desconectar-socket");
            localStorage.removeItem("$expire");
            localStorage.removeItem("$userId");
            if (window.location.pathname.split("/").reverse()[0] != "login") {
              that.$router.push("/login");
            }
          }
        });
    },
    getChatPage(pagina) {
      this.mensajeOffset = this.mensajes[0];
      if (this.mensajeOffset != null && this.mensajeOffset.id == null) {
        this.mensajeOffset = this.mensajes[1];
      }
      this.currentPage = pagina;
      var pag = "";
      if (pagina != null) {
        pag = "?page=" + pagina;
      }
      var that = this;
      this.$axios
        .get(this.$localurl + "/api/v1/messages/" + this.conversacion.id + pag)
        .then(function(response) {
          that.mostrarLoading = false;
          response.data.messages.data.reverse();
          that.mensajes = response.data.messages.data.concat(that.mensajes);
          that.getSeparadores();
        })
        .catch(function(response) {
          that.mostrarLoading = false;
          if (
            response != null &&
            response.response != null &&
            response.response.status == 401
          ) {
            console.log("desconecto socket");
            that.$eventHub.$emit("home-desconectar-socket");
            localStorage.removeItem("$expire");
            localStorage.removeItem("$userId");
            if (window.location.pathname.split("/").reverse()[0] != "login") {
              that.$router.push("/login");
            }
          }
        });
    },
    getSeparadores() {
      var fechas = [];
      this.mensajes = this.mensajes.filter(m => m.fecha == null);
      var cantidad = this.mensajes.length;
      for (var i = 0; i < cantidad; i++) {
        var m = this.mensajes[i];
        if (m.created_at != null) {
          var d = new Date(m.created_at);
          d.setHours(d.getHours() + 3);
          let day = d.getDate();
          let month = d.getMonth() + 1;
          let year = d.getFullYear();
          let fecha = day + "/" + month + "/" + year;
          var today = new Date();
          let todayday = today.getDate();
          let todaymonth = today.getMonth() + 1;
          let todayyear = today.getFullYear();
          if (day != todayday || month != todaymonth || year != todayyear) {
            if (fechas.includes(fecha) == false) {
              var days = [
                "Domingo",
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado"
              ];
              fecha = days[d.getDay()] + " " + fecha;
              fechas.push(fecha);
              if (!this.mensajes.some(m => m.fecha == fecha)) {
                this.mensajes.splice(i, 0, { fecha: fecha });
                cantidad++;
              }
            }
          } else {
            if (!this.mensajes.some(m => m.fecha == "HOY")) {
              this.mensajes.splice(i, 0, { fecha: "HOY" });
              cantidad++;
            }
          }
        }
      }
      var that = this;
      this.$nextTick(() => {
        that.scrollToBottom();
      });
    },
    onScroll() {
      var target = this.$refs.chatScroll;
      if (target.scrollTop < target.clientHeight * 0.1) {
        if (this.currentPage < this.lastPage) {
          this.offset = this.offset + this.limit;
          this.currentPage++;
          this.getChatPage(this.currentPage);
        }
      }
    },
    scrollToBottom() {
      var that = this;
      this.$nextTick(() => {
        if (that.mensajeOffset != null) {
          if (document.getElementById(that.mensajeOffset.id) != null) {
            document.getElementById(
              "chatScroll"
            ).scrollTop = document.getElementById(
              that.mensajeOffset.id
            ).offsetTop;
          } else {
            setTimeout(function() {
              that.scrollToBottom();
            }, 200);
          }
        }
      });
    },
    enviar() {
      if (this.enviando == false) {
        this.enviando = true;
        this.scrollToBottom();
        var texto = this.$refs.inputTexto.value;
        if (texto != "") {
          this.$refs.inputTexto.value = "";
          var data = new FormData();
          data.append("message", texto);
          data.append("receiver_id", this.conversacion.user_dest.id);
          var that = this;
          this.$axios
            .post(this.$localurl + "/api/v1/messages/textMessage", data)
            .then(function() {
              that.enviando = false;
              that.getChat();
            })
            .catch(function(response) {
              that.enviando = false;
              if (
                response != null &&
                response.response != null &&
                response.response.status == 401
              ) {
                console.log("desconecto socket");
                that.$eventHub.$emit("home-desconectar-socket");
                localStorage.removeItem("$expire");
                localStorage.removeItem("$userId");
                if (
                  window.location.pathname.split("/").reverse()[0] != "login"
                ) {
                  that.$router.push("/login");
                }
              }
              alert("Se produjo un error, reintente");
            });
        }
      }
    },
    isOverflown(element) {
      return (
        element.scrollHeight > element.clientHeight ||
        element.scrollWidth > element.clientWidth
      );
    },
    adjuntar() {
      this.$refs.adjuntoFiles.click();
    },
    changeAdjunto() {
      if (this.$refs.adjuntoFiles.files.length > 0) {
        var data = new FormData();
        data.append("message", "archivos");
        data.append("receiver_id", this.conversacion.user_dest.id);

        this.$refs.adjuntoFiles.files.forEach(function(value, i) {
          data.append("file[" + i + "]", value);
        });

        var that = this;
        this.$axios
          .post(this.$localurl + "/api/v1/messages/fileMessage", data)
          .then(function() {
            that.getChat();
          })
          .catch(function(response) {
            if (
              response != null &&
              response.response != null &&
              response.response.status == 401
            ) {
              console.log("desconecto socket");
              that.$eventHub.$emit("home-desconectar-socket");
              localStorage.removeItem("$expire");
              localStorage.removeItem("$userId");
              if (window.location.pathname.split("/").reverse()[0] != "login") {
                that.$router.push("/login");
              }
            }
            var string = "";
            response.response.data.errors["file.0"].forEach(
              e => (string = string + e + ", ")
            );
            string = string.substr(0, string.length - 3);
            console.log(string);
            alert(string);
          });
      }
    },
    enviarPosicion(){
      var that = this;
      this.mostrarOpciones = false;
      navigator.geolocation.getCurrentPosition(function(position) {
        that.enviando = true;
        var data = new FormData();
        data.append("lat", position.coords.latitude);
        data.append("lon", position.coords.longitude);
        data.append("alt", (position.coords.altitude != null ? position.coords.altitude : 0));
        data.append("receiver_id", that.conversacion.user_dest.id);
          that.$axios
            .post(that.$localurl + "/api/v1/messages/positionMessage", data)
            .then(function() {
              that.enviando = false;
              that.getChat();
            })
            .catch(function(response) {
              that.enviando = false;
              if (response != null && response.response != null && response.response.status == 401) {
                console.log("desconecto socket");
                that.$eventHub.$emit("home-desconectar-socket");
                localStorage.removeItem("$expire");
                localStorage.removeItem("$userId");
                if(window.location.pathname.split("/").reverse()[0] != "login"){
                that.$router.push("/login");
              }
              }
              alert("Se produjo un error, reintente");
            });
      });
    }
  }
};
</script>

<style scoped src="../assets/css/components/chat.css"></style>
