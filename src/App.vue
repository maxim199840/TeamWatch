<template>
    <div id="app">
        <authorization v-if="userId===null" @login="login"></authorization>
        <overview v-else-if="lobbyId===null" @logout="logout" @connect="connect"></overview>
        <connected v-else @disconnect="disconnect"></connected>
    </div>
</template>

<script>
  import Authorization from './Authorization';
  import Overview from './Overview';
  import Connected from './Connected';

  export default {
    name: 'app',
    data() {
      return {
        userId: null,
        lobbyId: null,
      };
    },
    watch: {
      userId() {
        this.saveToStorage('userId');
      },
      lobbyId() {
        this.saveToStorage('lobbyId');
      },
    },
    created() {
      this.loadFromStorage('userId');
      this.loadFromStorage('lobbyId');
    },
    components: {
      Authorization,
      Overview,
      Connected,
    },
    methods: {
      loadFromStorage(key) {
        chrome.storage.local.get(key, data => this[key] = data[key]);
      },
      saveToStorage(key) {
        chrome.storage.local.set({[key]: this[key]});
      },
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