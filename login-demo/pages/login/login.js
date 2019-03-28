var app = getApp();
var API_URL = app.globalData.baseUrl + '/wXLogin/decodeUserInfo';
Page({
  data: {
    logo: "../../images/logo.png",
    title: "趣味视频",
    logged: false
  },
  onLoad: function () {
    var me = this;
    var userInfo = app.globalData.userInfo;
    if (userInfo != null && userInfo != "" && userInfo != undefined) {
      me.setData({
        logged: true
      })
    }
    
  },
  login: function (e) {
    wx.login({
      success: function (r) {
        var code = r.code;//登录凭证  
        console.log(code)
        if (code) {
          //2、调用获取用户信息接口  
          wx.getUserInfo({
            success: function (res) {
              console.log({ encryptedData: res.encryptedData, iv: res.iv, code: code })
              //3.请求自己的服务器，解密用户信息 获取unionId等加密信息  
              wx.request({
                url: API_URL,//自己的服务接口地址  
                method: 'POST',
                header: {
                  'content-type': 'application/x-www-form-urlencoded'
                },
                data: { encryptedData: res.encryptedData, iv: res.iv, code: code },
                success: function (res) {

                  //4.解密成功后 获取自己服务器返回的结果  
                  if (res.data.status == 200) {
                    var userInfo_ = res.data.data;
                    // app.globalData.userInfo = userInfo_;
                    console.log(userInfo_)
                  } else {
                    console.log('解密失败')
                  }

                },
                fail: function () {
                  console.log('系统错误')
                }
              })
            },
            fail: function () {
              console.log('获取用户信息失败')
            }
          })

        } else {
          console.log('获取用户登录态失败！' + r.errMsg)
        }
      },
      fail: function () {
        console.log('登陆失败')
      }
    })
  }
})
