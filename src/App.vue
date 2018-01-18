<template>
    <div id="app">
        <component :is="mainComponent"></component>
    </div>
</template>

<script>
  import Overview from './Overview';
  import Connected from './Connected';

  export default {
    name: 'app',
    data() {
      return {
        userId: null,
        lobbyId: null,
        mainComponent: null,
      };
    },
    beforeCreate() {

    },
    components: {
      Overview,
      Connected,
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
        margin-top: 60px;
    }
</style>