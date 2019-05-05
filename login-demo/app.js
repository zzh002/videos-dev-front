//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    
    var me = this;

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: function (res) {
              me.globalData.userInfo = res.userInfo;
              console.log(me.globalData.userInfo);
            },
            fail: function () {
              wx.redirectTo({
                url: '../../pages/login/login',
              })
            }
          })
        } else {
          //未授权, 跳转登录页面
          wx.redirectTo({
            url: '../../pages/login/login',
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    baseUrl: 'http://127.0.0.1:8080/videos'
  }
})
