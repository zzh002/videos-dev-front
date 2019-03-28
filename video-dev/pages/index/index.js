const app = getApp()
var videoUtil = require('../../utils/videoUtil.js')

Page({
  data: {
    // 用于分页的属性
    totalPage: 1,
    page: 1,
    videoList: [],
    current: 0,
    isVideo: [],
    number: 2,
    
    
    screenWidth: 350,
    serverUrl: "",

    searchContent: ""
  },

  onLoad: function (params) {
    var me = this;
    var screenWidth = wx.getSystemInfoSync().screenWidth;
    var isVideo = [];
    isVideo[0] = true;
    me.setData({
      screenWidth: screenWidth,
      isVideo: isVideo
    });
    
    var searchContent = params.search;
    var isSaveRecord = params.isSaveRecord;
    if (isSaveRecord == null || isSaveRecord == '' || isSaveRecord == undefined) {
      isSaveRecord = 0;
    }

    if (searchContent != null && searchContent != '' && searchContent != undefined) {
      me.setData({
        searchContent: searchContent
      });
    }
   

    // 获取当前的分页数
    var page = me.data.page;
    me.getAllVideoList(page, isSaveRecord);

    
  },

  getAllVideoList: function (page, isSaveRecord) {
    var me = this;
    var serverUrl = app.serverUrl;
    wx.showLoading({
      title: '加载中...',
    });

    var searchContent = me.data.searchContent;
    var user = app.getGlobalUserInfo();

    wx.request({
      url: serverUrl + '/video/showAll?page=' + page + "&isSaveRecord=" + isSaveRecord + 
      "&loginUserId=" + user.id,
      method: "POST",
      data: {
        videoDesc: searchContent
      },
      success: function (res) {
        wx.hideLoading();
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();

        console.log(res.data);

        // 判断当前页page是否是第一页，如果是第一页，那么设置videoList为空
        if (page === 1) {
          me.setData({
            videoList: []
          });
        }

        var videoList = res.data.data.rows;
        var newVideoList = me.data.videoList;

        me.setData({
          videoList: newVideoList.concat(videoList),
          page: page,
          totalPage: res.data.data.total,
          serverUrl: serverUrl
        });
        newVideoList = me.data.videoList;
        if (newVideoList == null || newVideoList == '' || newVideoList == undefined) {
          
          wx.showToast({
            title: '视频为空哦~~',
            icon: "none"
          });

          //返回
          setTimeout(function () {
            wx.navigateBack({
              delta: 1
            })
          }, 1500); //延迟时间(ms)
          
        } else if (newVideoList.length == 1) {
          me.setData({
            number: 1
          })
        }
        
        
      }
    })
  },


  showVideoInfo: function (e) {
    var me = this;
    var videoList = me.data.videoList;
    var arrindex = e.target.dataset.arrindex;
    var focus = e.target.dataset.focus;
    var videoInfo = JSON.stringify(videoList[arrindex]);

    wx.navigateTo({
      url: '../videoinfo/videoinfo?videoInfo=' + videoInfo + '&focus=' + focus
    })
  },

  showPublisher: function (e) {
    var me = this;
    var videoList = me.data.videoList;
    var arrindex = e.target.dataset.arrindex;
    var videoInfo = videoList[arrindex];

    var user = app.getGlobalUserInfo();

    var realUrl = '../mine/mine#publisherId@' + videoInfo.userId;

    if (user == null || user == undefined || user == '') {
      wx.navigateTo({
        url: '../userLogin/login?redirectUrl=' + realUrl,
      })
    } else {
      wx.navigateTo({
        url: '../mine/mine?publisherId=' + videoInfo.userId,
      })
    }
  },
  
  change: function(e) {
    var me = this;
    var currentPage = me.data.page;
    var totalPage = me.data.totalPage;
    var newCurrent = e.detail.current;
    if (newCurrent + 2 >= 5 * currentPage ) {
      var page = currentPage + 1;
      me.getAllVideoList(page, 0);
    }
    var isVideo = [];
    isVideo[newCurrent] = true;

    me.setData ({
      current: newCurrent,
      isVideo: isVideo
    });

    
  },

  transition: function(e) {
    var me = this;
    var currentPage = me.data.page;
    var totalPage = me.data.totalPage;
    var current = me.data.current;
    var length = me.data.videoList.length;
 
    // 判断当前页数和总页数是否相等，如果相等则无需查询
    if (((currentPage === totalPage && current == length - 2) || length == 1) && e.detail.dy > 0) {
      wx.showToast({
        title: '已经没有视频啦~~',
        icon: "none"
      })
      return;
    }
  },

  videoPlay: function(e) {
    var me = this;
    var arrindex = e.target.dataset.arrindex;
    var isVideo = [];
    isVideo[arrindex] = true;

    me.setData({
      isVideo: isVideo
    });
  },

  likeVideo: function(e) {
    var me = this;
    var arrindex = e.target.dataset.arrindex;
    var videoList = me.data.videoList;
    var videoInfo = me.data.videoList[arrindex];
    var user = app.getGlobalUserInfo();

    

    var url = '/video/userLike?userId=' + user.id + '&videoId=' + videoInfo.id + '&videoCreaterId=' + videoInfo.userId;
    if (videoInfo.isPraise) {
      url = '/video/userUnLike?userId=' + user.id + '&videoId=' + videoInfo.id + '&videoCreaterId=' + videoInfo.userId;
    }

      var serverUrl = app.serverUrl;
      wx.showLoading({
        title: '...',
      })
      wx.request({
        url: serverUrl + url,
        method: 'POST',
        header: {
          'content-type': 'application/json', // 默认值
          'headerUserId': user.id,
          'headerUserToken': user.userToken
        },
        success: function (res) {
          wx.hideLoading();
          if (res.data.status == 200) {
            if (videoInfo.isPraise) {
              videoInfo.likeCounts--;
            } else {
              videoInfo.likeCounts++;
            }
            videoInfo.isPraise = !videoInfo.isPraise;
            videoList[arrindex] = videoInfo;
            
            me.setData({
              videoList: videoList
            });
          
          } else if (res.data.status == 500) {
            wx.showToast({
              title: '出错了~~',
              icon: "none"
            })
          } else {
            var realUrl = "../index/index";
              wx.navigateTo({
                url: '../userLogin/login?redirectUrl=' + realUrl,
            })
          }
        }
      })

  },

  showIndex: function () {
    wx.redirectTo({
      url: '../index/index',
    })
  },

  showMine: function () {
    var user = app.getGlobalUserInfo();

    if (user == null || user == undefined || user == '') {
      wx.navigateTo({
        url: '../userLogin/login',
      })
    } else {
      wx.navigateTo({
        url: '../mine/mine',
      })
    }
  },

  upload: function () {
    var me = this;

    var user = app.getGlobalUserInfo();

    var realUrl = '../mine/mine';

    if (user == null || user == undefined || user == '') {
      wx.navigateTo({
        url: '../userLogin/login?redirectUrl=' + realUrl,
      })
    } else {
     
      wx.showActionSheet({
        itemList: ['本地上传', '拍摄'],
        success: function (res) {
          console.log(res.tapIndex);
          if (res.tapIndex == 0) {
            var type = "album";
            videoUtil.uploadVideo(type);
          } else if (res.tapIndex == 1) {
            var type = "camera";
            videoUtil.uploadVideo(type);
          }
        }
      })
    }
  },


})
