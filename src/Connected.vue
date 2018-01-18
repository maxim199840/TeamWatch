<template>
    <div>
        <button @click="disconnect">Disconnect</button>
    </div>
</template>

<script>
  export default {
    name: 'connected',
    methods: {
      disconnect() {
        alert('Disconnected!');
      },
    },
  };
</script>