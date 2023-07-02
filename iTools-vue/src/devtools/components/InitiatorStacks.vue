<template>
    <div class="initiatorStack">
        <el-form :inline="true" :model="query" size="mini" class="itools-request-query">
            <el-form-item label="启用过滤" prop="enableFilter">
                <el-switch v-model="query.enableFilter"></el-switch>
            </el-form-item>
            <el-form-item label="过滤规则" prop="initiatorRegExp">
                <el-input v-model="query.initiatorRegExp" placeholder="RegExp expression" style="width: 280px;"></el-input>
            </el-form-item>
        </el-form>
        <!-- 调用栈列表 -->
        <el-table :data="viewDdata" stripe border size="mini" max-height="500" style="width: 100%">
            <!-- <el-table-column type="index"></el-table-column> -->
            <el-table-column prop="functionName" label="函数名" width="auto" :show-overflow-tooltip="true">
                <template slot-scope="scope">
                    <span>{{scope.row.functionName || 'Anonymous Function'}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="position" label="位置" width="auto">
                <template slot-scope="scope">
                    <el-popover trigger="hover" placement="right" width="400">
                        <span>{{scope.row.url}}(<span>行:{{scope.row.lineNumber+1}}列:{{scope.row.columnNumber+1}})</span></span>
                        <span slot="reference" class="name-wrapper">
                            <el-link @click="openResource(scope.row.url, scope.row.lineNumber+1)" type="primary">
                                <span>{{formatFunctionName(scope.row.url)}}</span>(<span>行:{{scope.row.lineNumber+1}}列:{{scope.row.columnNumber+1}})</span>
                            </el-link>
                        </span>
                    </el-popover>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
  
<script>
import devtoolsUtil from '../utils/devtools'

export default {
    props: {
        data: {
            type: Array,
            default: () => []
        },
        filter: {
            type: String,
            default: ''
        },
    },
    data() {
        return {
            query: {
                enableFilter: true,
                initiatorRegExp: ''
            }
        };
    },

    watch: {
        filter: {
            immediate: true,
            handler(val) {
                this.query.initiatorRegExp = val
            }
        }
    },

    computed: {
        viewDdata() {
            if(!this.query.enableFilter) {
                return this.data
            }
            return devtoolsUtil.filterInitiator(this.data, this.query.initiatorRegExp)
        }
    },

    methods: {
        formatFunctionName(name) {
            return devtoolsUtil.getFileNameFromUrl(name)
        },

        openResource(url, lineNumber) {
            devtoolsUtil.openResource(url, lineNumber).then(res => {
                devtoolsUtil.log('打开资源面板 --> ', res)
            })
        }
    },
}
</script>
  