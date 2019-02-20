//app.js
App({
  onLaunch: function () {
    let hasLogin = wx.getStorageSync('token');
    if (hasLogin) {
      wx.checkSession({
        success: res => {

        },
        fail: () => {
          this.startLogin();
        }
      });
    }
  },
  globalData: {
    userInfo: null,
    systemConfig: {
      _base: ''
    }
  },
  startLogin: function () {
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  getUser: function () {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  // 封装微信请求方式 
  // 格式 app.wxRequest(app.globalData.systemConfig._base + '/server',obj,'', res => {})
  wxRequest: function (url, params, method, _callback, txt) {
    var that = this;
    let requestMethod;
    let requestHeader = {
      'token': wx.getStorageSync('token'),
    };
    if (method == 'POST' || method == 'post') {
      requestMethod = 'POST';
      requestHeader['content-type'] = 'application/x-www-form-urlencoded;';
    } else {
      requestMethod = 'GET';
    }
    if (txt == '' || txt == null || txt == undefined) {
      wx.showLoading({
        title: '努力加载中',
        mask: true
      });
    } else {
      wx.showLoading({
        title: txt,
        mask: true
      });
    }
    wx.request({
      url: url,
      data: params,
      header: requestHeader,
      method: requestMethod,
      dataType: 'json',
      success: res => {
        if (res.data.error) {
          let flag; // true则引导至登录界面
          let rollBackflag; // true则返回上一个页面
          if (res.data.error == '登陆认证已失效，请重新登录') {
            flag = true
          }
          if (res.data.error == 'java.lang.RuntimeException: 当前设备已使用！无法领用！' || res.data.error == 'java.lang.RuntimeException: 还回人和领用人不一致，不可还回！' || res.data.error == 'java.lang.RuntimeException: 不能领用了，该设备已经达到限制使用次数' || res.data.error == 'java.lang.RuntimeException: 当前设备未使用！无法还回！') {
            rollBackflag = true
          }
          wx.showModal({
            title: '温馨提示',
            content: res.data.error.replace(/java.lang.RuntimeException:/g, ''),
            showCancel: false,
            success: res => {
              if (res.confirm) {
                if (flag) {
                  wx.redirectTo({
                    url: '/pages/login/login'
                  });
                }
                if (rollBackflag) {
                  wx.navigateBack({});
                }
              }
            }
          });
          return;
        };
        if (_callback) {
          _callback(res);
        }
      },
      fail: err => {
        wx.showModal({
          title: '温馨提示',
          content: err,
          showCancel: false,
          success: res => {
            if (res.confirm) {
              wx.redirectTo({
                url: '/pages/login/login'
              });
            }
          }
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
})