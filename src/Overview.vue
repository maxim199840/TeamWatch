<template>
    <div>
        <label>User id:<input type="text" v-model.lazy.number="userId"/></label>
        <label>Lobby id:<input type="text" v-model.lazy.number="lobbyId"/></label>
        <button @click="connectToLobby">Connect</button>
    </div>
</template>

<script>
  export default {
    name: 'overview',
    data() {
      return {};
    },
    methods: {
      connectToLobby() {
        alert('Connected!');
      },
    },
  };
</script>