<template>
    <div id="app">
        <template v-if="userId===null">
            <authorization @login="login"/>
        </template>
        <template v-else-if="lobbyId===null">
            <overview @logout="logout" @connect="connect"/>
        </template>
        <template v-else>
            <connected @disconnect="disconnect"/>
        </template>
    </div>
</template>

<script>
  import Authorization from './Authorization';
  import Overview from './Overview';
  import Connected from './Connected';
  import {storageController} from './storageController';

  storageController.onchange = () => {};

  export default {
    name: 'app',
    data() {
      return {
        userId: null,
        lobbyId: null,
      };
    },
    watch: {
      userId(value) {
        storageController.setAsyncStorage({userId: value});
      },
      lobbyId(value) {
        storageController.setAsyncStorage({lobbyId: value});
      },
    },
    created() {
      storageController.getAsyncStorage(['userId', 'lobbyId']).
          then(data => Object.assign(this, data));
    },
    components: {
      Authorization,
      Overview,
      Connected,
    },
    methods: {
      login(userId) {
        this.userId = userId;
      },
      logout() {
        this.userId = null;
      },
      connect(lobbyId) {
        this.lobbyId = lobbyId;
      },
      disconnect() {
        this.lobbyId = null;
      },
    },
  };
</script>

<style lang="css">
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        width: 250px;
        height: 100px;
    }
</style>