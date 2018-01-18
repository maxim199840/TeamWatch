<template>
    <div>
        <button @click="$emit('logout')">Logout</button>
        <br>
        <label>
            Lobby id:
            <input type="text" v-model.lazy="lobbyId"/>
        </label>
        <br>
        <button @click="$emit('connect',lobbyId)">Connect</button>
    </div>
</template>

<script>
  export default {
    name: 'overview',
    data() {
      return {
        lobbyId: null,
      };
    },
  };
</script>