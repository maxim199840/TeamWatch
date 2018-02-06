<template>
    <div>
        <button @click="onSignIn">Sign in</button>
    </div>
</template>

<script>
  import {browser} from '../browserApi';
  import {SIGN_IN} from '../messageTypes';

  export default {
    name: 'authorization',
    methods: {
      onSignIn() {
        browser.runtime.sendMessage({type: SIGN_IN});
      },
    },
  };
</script>