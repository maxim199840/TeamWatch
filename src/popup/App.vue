<template>
    <div id="app">
        <template v-if="!isAuthorized">
            <authorization @login="login"/>
        </template>
        <template v-else>
            <overview v-bind="{lobbiesHistory}" @logout="logout" @connect="connect"/>
        </template>
    </div>
</template>

<script>
  import Authorization from './Authorization';
  import Overview from './Overview';
  import {browser} from '../browserApi';
  import {CONNECT_TO_LOBBY} from '../messageTypes';

  export default {
    name: 'app',
    data() {
      return {
        user: null,
        lobbiesHistory: null,
      };
    },
    components: {
      Authorization,
      Overview,
    },
    computed: {
      isAuthorized() {
        return this.user;
      },
    },
    mounted() {
      browser.storage.sync.get(['user', 'lobbiesHistory'], ({user, lobbiesHistory}) => {
        this.user = user;
        this.lobbiesHistory = lobbiesHistory;
      });
    },
    methods: {
      login(user) {
        this.user = user;
      },
      logout() {
        this.user = null;
      },
      connect(lobbyId) {
        browser.runtime.sendMessage({type: CONNECT_TO_LOBBY, payload: {lobbyId}});
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