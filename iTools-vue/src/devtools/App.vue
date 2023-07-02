<template>
  <div id="app" class="iTools">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="Requester" name="first">
        <!-- 筛选条件 -->
        <div class="iTools-requester-header">
          <el-form :inline="true" :model="query" size="mini" class="itools-requester-query">
            <el-button @click="clearHars" class="iTools-requester-clear" type="text" size="mini"><i class="el-icon-delete"></i>清除</el-button>
            <el-form-item label="保留日志" prop="keepLogsAlive">
              <el-switch v-model="query.keepLogsAlive" ></el-switch>
            </el-form-item>
            <el-form-item label="" prop="initiator">
              <el-input v-model="query.keyword" placeholder="筛选器" style="width: 156px;"></el-input>
            </el-form-item>
            <!-- <el-form-item label="方法" prop="methods">
              <el-select v-model="query.methods" multiple collapse-tags placeholder="方法" style="width: 156px;">
                <el-option v-for="method in httpMethods" :key="method" :label="method" :value="method"></el-option>
              </el-select>
            </el-form-item> -->
            <el-form-item label="类型" prop="resourceType">
              <el-checkbox-group v-model="query.resourceType">
                <el-checkbox v-for="type in httpResourceTypes" :key="type.value" :label="type.value" name="resourceType">
                  {{ type.label }}
                </el-checkbox>
              </el-checkbox-group>
              <!-- <el-select v-model="query.resourceType" multiple placeholder="类型">
                <el-option label="Fecth/XHR" value="Fecth/XHR"></el-option>
                <el-option label="JS" value="script"></el-option>
                <el-option label="CSS" value="stylesheet"></el-option>
                <el-option label="Img" value="image"></el-option>
                <el-option label="Other" value="other"></el-option>
              </el-select> -->
            </el-form-item>
            <el-form-item label="发起程序" prop="initiator">
              <el-input v-model="query.initiatorRegExp" placeholder="RegExp expression" style="width: 280px;"></el-input>
            </el-form-item>
            <el-form-item label="" prop="interceptor">
              <RequesterInterceptor v-model="query.interceptor" />
            </el-form-item>
          </el-form>
        </div>
        <div class="iTools-requester-body">
          <!-- 网络请求列表 -->
          <el-table
            :data="viewData"
            stripe
            border
            size="mini"
            style="width: 100%">
            <!-- <el-table-column
              prop="url"
              label="URL"
              width="auto"
              :show-overflow-tooltip="true">
            </el-table-column> -->
            <el-table-column
              prop="name"
              label="名称"
              width="auto"
              :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span :title="scope.row.url">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="method"
              label="方法"
              width="150"
              min-width="100">
            </el-table-column>
            <el-table-column
              prop="status"
              label="状态"
              width="150"
              min-width="100">
            </el-table-column>
            <el-table-column
              prop="resourceType"
              label="类型"
              width="150"
              min-width="100">
            </el-table-column>
            <el-table-column
              prop="transferSize"
              label="大小"
              width="150"
              min-width="100">
              <template slot-scope="scope">
                <span>{{ scope.row.transferSize | formatResponseSize }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="initiator"
              label="发起程序"
              width="auto"
              :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <el-popover trigger="hover" :open-delay="200" placement="right" width="470">
                  <InitiatorStack :data="scope.row.stackCallFrames" :filter="query.initiatorRegExp" />
                  <span slot="reference" class="name-wrapper">
                    <el-link @click="openResource(scope.row.initiatorData.url, scope.row.initiatorData.lineNumber+1)" type="primary">
                      <span>{{scope.row.initiator}}</span>
                      (<span>行:{{scope.row.initiatorData.lineNumber+1}}列:{{scope.row.initiatorData.columnNumber+1}})</span>
                    </el-link>
                  </span>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column
              prop="interceptorInfo"
              label="拦截处理"
              width="auto"
              min-width="100"
              :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span>{{ scope.row.interceptorInfo | formatInterceptorInfo }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="time"
              label="时间"
              width="150"
              min-width="100"
              :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span>{{ scope.row.time | formatTimeConsuming }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      <!-- <el-tab-pane label="请求拦截" name="second">请求拦截</el-tab-pane> -->
      <el-tab-pane label="Debugger" name="third">Debugger</el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { httpMethods, httpResourceTypes } from '../constants/network'
import devtoolsUtil from './utils/devtools'
import InitiatorStack from './components/InitiatorStacks.vue'
import RequesterInterceptor from './components/RequesterInterceptor.vue'

import networkData from '../../mock/chrome-devtools.network.data.json'

export default {
  components: {
    InitiatorStack,
    RequesterInterceptor
  },
  
  data() {
    return {
      activeName: 'first',
      httpMethods,
      httpResourceTypes,
      query: {
        keepLogsAlive: false,
        keyword: '',
        methods: ['GET','POST','PUT','DELETE','OPTIONS'],
        resourceType: ['Fecth/XHR'],
        initiatorRegExp: '^((?!(vue|node_modules|jquery|echarts|axios)).)*$',
        interceptor: {}
      },
      tableData: []
    };
  },

  computed: {
    viewData() {
      const { keyword, methods, resourceType, initiatorRegExp } = this.query
      const rows = this.tableData.filter(x => {
        const isValidName = keyword.length ? x.name.indexOf(keyword) > -1 : true
        const isValidMethod = methods.includes(x.method)
        const isValidResourceType = resourceType.some(y => {
          if(y === 'Fecth/XHR') return ['xhr','fetch'].includes(x.resourceType);
          if(y === 'other') return ['preflight','other','font','document','media'].includes(x.resourceType);
          return y === x.resourceType
        })
        return isValidName && isValidMethod && isValidResourceType
      })
      return rows.map(x => {
        const filterInitiators = devtoolsUtil.filterInitiator(x.stackCallFrames, initiatorRegExp);
        const top = filterInitiators[0] || {}
        return {
          ...x,
          initiator: devtoolsUtil.getFileNameFromUrl(top?.url),
          initiatorData: top,
        }
      })
    }
  },

  created() {
    if(window.location.hostname === 'localhost') {
      this.tableData = networkData.map(x => {
        return this.handleReqRowData(x)
      })
    } else {
      this.init();
    }
  },

  methods: {
    handleClick(tab, event) {
      console.log(tab, event);
    },
    onSubmit() {
      devtoolsUtil.getNetworkHAR.then(res => {
        this.harinfos = JSON.stringify(res, null, 2)
      })
    },

    handleReqRowData(data) {
      const { request: { url, method }, _initiator, _resourceType: resourceType, response: { status, _transferSize: transferSize }, time, timings } = data
      const name = devtoolsUtil.getFileNameFromUrl(url)
      const { name: initiator, data: initiatorData, stackCallFrames } = devtoolsUtil.getInitiator(_initiator, this.query.initiatorRegExp)
      
      
      return {
        url,
        name,
        method,
        status,
        resourceType,
        initiator,
        initiatorData,
        stackCallFrames,
        transferSize,
        time,
        interceptorInfo: {}
      }
    },

    async init() {
      const successCallback = data => {
        devtoolsUtil.log(data);

        const row = this.handleReqRowData(data)
        this.tableData.push(row)
      } 
      const errorCallback = err => {
        devtoolsUtil.log(err.stack || err.toString());
      }

      try {
        const hars = await devtoolsUtil.getNetworkHAR()
        this.tableData = hars?.entries?.map(x => this.handleReqRowData(x))
      } catch (error) {
        this.tableData = []
      } finally {
        devtoolsUtil.createNetworkListener(successCallback, errorCallback)
        devtoolsUtil.createTabUpdatedListener()
        devtoolsUtil.createwebNavigationListener(() => {
          if(!this.query.keepLogsAlive) this.clearHars()
        })
        devtoolsUtil.onBackgroundMessage(message => {
          if (typeof message === 'object' && message.code === 'webResponseHanldeCompleted') {
            this.updateRows(message.data)
          } else {
            devtoolsUtil.log('background消息 --> ', message)
          }
        })
      }
    },

    clearHars() {
      this.tableData = []
    },

    openResource(url, lineNumber) {
        devtoolsUtil.openResource(url, lineNumber).then(res => {
            devtoolsUtil.log('打开资源面板 --> ', res)
        })
    },

    updateRows(data) {
      const row = this.tableData.find(x => {
        return x.url === data?.request?.url
      })

      if(row) {
        row.interceptorInfo.match = true
      }
    }
  },
}
</script>
