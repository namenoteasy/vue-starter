<template>
<div>{{hello}}</div>
</template>

<style lang="less">
.has-ad-rt .content {
    margin-top: 116px;
}
</style>

<script lang="ts">
import vm from './index'

import {
    Component,
} from 'vue-property-decorator';

@Component({
  components: {
    /*import components file template:'%name': require('%path').default,
     */
    /*start:import components file*/
    /*end:import components file*/
  },
})
export default vm
</script>