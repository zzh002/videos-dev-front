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
            lang: "zh_CN",
            success: function (res) {
              // me.setGlobalUserInfo(res.userInfo);
              console.log(res.userInfo);
            },
            fail: function () {
              wx.redirectTo({
                url: '../../pages/userLogin/login',
              })
            }
          })
        } else {
          //未授权, 跳转登录页面
          wx.redirectTo({
            url: '../../pages/userLogin/login',
          })
        }
      }
    })
  },
  serverUrl: 'http://192.168.10.109:8080/videos',
  userInfo: null,
  setGlobalUserInfo: function (user) {
    wx.setStorageSync("userInfo", user);
  },

  getGlobalUserInfo: function () {
    return wx.getStorageSync("userInfo");
  },
  reportReasonArray: [
    "色情低俗",
    "政治敏感",
    "涉嫌诈骗",
    "辱骂谩骂",
    "广告垃圾",
    "诱导分享",
    "引人不适",
    "过于暴力",
    "违法违纪",
    "其它原因"
  ]
})