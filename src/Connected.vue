<template>
    <div>
        <button @click="$emit('disconnect')">Disconnect</button>
    </div>
</template>

<script>
  export default {
    name: 'connected',
  };
</script>