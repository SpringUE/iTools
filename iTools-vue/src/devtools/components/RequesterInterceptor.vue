<template>
    <span class="requester-interceptor">
        <span class="requester-interceptor-button">
            <el-link @click="openDialog" type="primary" :underline="false">
                <i class="el-icon-setting"></i>
                <span class="requester-interceptor-result-text">请求拦截器：{{tableData.length}}个配置({{validInterceptors}}个生效)</span>
            </el-link>
        </span>
        <el-dialog title="拦截配置" :visible.sync="dialogVisible" custom-class="el-dialog--mini" width="1000px" :before-close="handleClose">
            <div class="requester-interceptor-configs">
                <el-empty v-if="!tableData.length" :image-size="100">
                    <el-button @click="addRule(0)" size="mini" type="primary" icon="el-icon-circle-plus-outline">添加</el-button>
                </el-empty>
                <el-table v-else :data="tableData" size="mini" border style="width: 100%">
                    <el-table-column fixed prop="status" label="开关" width="80">
                        <template slot-scope="scope">
                            <el-switch v-model="scope.row.status" ></el-switch>
                        </template>
                    </el-table-column>
                    <el-table-column prop="rule" label="匹配规则" width="240">
                        <template slot-scope="scope">
                            <el-input v-model="scope.row.rule" type="textarea" :rows="1"></el-input>
                        </template>
                    </el-table-column>
                    <el-table-column prop="handleType" label="处理类型" width="150">
                        <template slot-scope="scope">
                            <el-select v-model="scope.row.handleType">
                                <el-option label="修改请求/响应" value="modifiedRequest"></el-option>
                                <el-option label="格式化响应内容" value="formatResponseText"></el-option>
                                <el-option label="自定义任务" value="diyTask"></el-option>
                            </el-select>
                        </template>
                    </el-table-column>
                    <el-table-column prop="handler" label="处理程序" width="auto">
                        <template slot-scope="scope">
                            <el-input v-model="scope.row.handler" type="textarea" :rows="1"></el-input>
                        </template>
                    </el-table-column>
                    <el-table-column fixed="right" label="操作" width="90">
                        <template slot-scope="scope">
                            <el-button @click="delRule(scope.rowIndex)" type="text" size="small">删除</el-button>
                            <el-button @click="addRule(scope.rowIndex)" type="text" size="small">添加</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
            </span>
        </el-dialog>
    </span>
</template>
  
<script>
import devtoolsUtil from '../utils/devtools'

export default {
    props: {
        value: {
            type: Object,
            default: () => { }
        },
    },
    data() {
        return {
            dialogVisible: false,
            query: {
            },
            tableData: [{
                rule: '*inspector.js',
                status: true,
                handler: `sourceFormator({tabSize:2,indentStyle:"space"})`,
                handleType: 'formatResponseText',
            }, {
                handler: 'function(request) {}',
                handleType: 'modifiedRequest',
                status: false,
                rule: '.min.js',
            }]
        };
    },

    computed: {
        validInterceptors() {
            return this.tableData.filter(x => x.status).length
        }
    },

    created() {
        this.formatRequestJsFile()
    },

    methods: {
        handleClose(done) {
            this.$confirm('确认关闭？')
                .then(_ => {
                    done();
                })
                .catch(_ => { });
        },

        formatRequestJsFile() {
            const urls = this.tableData[0].rule;
            const successCallback = (details) => {
                this.$emit('interceptSuccess', details)
            }
            devtoolsUtil.formatRequestJsFile({
                responseHanlder(content) {
                    return devtoolsUtil.sourceFormator(content, {})
                }, 
                urls: [urls],
                successCallback
            })
        },

        openDialog() {
            this.dialogVisible = true
        },
        closeDialog() {
            this.dialogVisible = false
        },

        delRule(rowIndex) {
            this.$confirm('确认操作吗？')
                .then(_ => {
                    this.tableData.splice(rowIndex, 1);
                })
                .catch(_ => { });
        },

        addRule(rowIndex) {
            this.tableData.splice(rowIndex, 0, {
                rule: '',
                handler: 'function(request) {}',
                handleType: 'modifiedRequest',
                status: true,
            });
        }
    },
}
</script>

<style lang="less" scoped>
.requester-interceptor-button {
    vertical-align: 1px;
}

.el-icon-setting {
    vertical-align: 1px;
}
</style>
  