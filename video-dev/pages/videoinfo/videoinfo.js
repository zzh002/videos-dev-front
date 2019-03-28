var videoUtil = require('../../utils/videoUtil.js')

const app = getApp()

Page({
  data: {
    cover: "cover",
    videoId: "",
    src: "",
    videoInfo: {},
    commentFocus: false,
    animationData: "",
    isPlay: true,
    bottom: 0,
    inputFocus: false,
    userLikeVideo: false,


    commentsPage: 1,
    commentsTotalPage: 1,
    commentsList: [],
    commentRecords: 0,
    commentDetailLists: [[]],


    placeholder: "留下你的精彩评论吧"
  },

  videoCtx: {},

  onLoad: function (params) {    
    var me = this;
    me.videoCtx = wx.createVideoContext("myVideo", me);

    // 获取上一个页面传入的参数
    var videoInfo = JSON.parse(params.videoInfo);

    var focus = params.focus;

    var height = videoInfo.videoHeight;
    var width = videoInfo.videoWidth;
    var cover = "cover";
    if (width >= height) {
      cover = "";
    }

    me.setData({
      videoId: videoInfo.id,
      src: app.serverUrl + videoInfo.videoPath,
      videoInfo: videoInfo,
      cover: cover
    });

    var serverUrl = app.serverUrl;
    var user = app.getGlobalUserInfo();
    var loginUserId = "";
    if (user != null && user != undefined && user != '') {
      loginUserId = user.id;
    }
    wx.request({
      url: serverUrl + '/user/queryPublisher?loginUserId=' + loginUserId + "&videoId=" + videoInfo.id + "&publishUserId=" + videoInfo.userId,
      method: 'POST',
      success: function(res) {
        console.log(res.data);

        var publisher = res.data.data.publisher;
        var userLikeVideo = res.data.data.userLikeVideo;

        me.setData({
          serverUrl: serverUrl,
          publisher: publisher,
          userLikeVideo: userLikeVideo
        });
      }
    })

    
    if (focus == "true") {
      me.showModal();
    }
  },

  onPlay: function() {
    var me = this;
    var videoContext = wx.createVideoContext("myVideo", me);
    var isPlay = me.data.isPlay;
    if (isPlay) {
      videoContext.pause();
      me.setData({
        isPlay: false
      });
    } else {
      videoContext.play();
      me.setData({
        isPlay: true
      })
    }
    
  },

  onShow: function () {
    var me = this;
    me.videoCtx.play();
  },

  onHide: function () {
    var me = this;
    me.videoCtx.pause();
  },

  showSearch: function () {
    wx.navigateTo({
      url: '../searchVideo/searchVideo',
    })
  },

  showPublisher: function () {
    var me = this;

    var user = app.getGlobalUserInfo();

    var videoInfo = me.data.videoInfo;
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


  upload: function () {
    var me = this;

    var user = app.getGlobalUserInfo();

    var videoInfo = JSON.stringify(me.data.videoInfo);
    var realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfo;

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

  likeVideoOrNot: function () {
    var me = this;
    var videoInfo = me.data.videoInfo;
    var user = app.getGlobalUserInfo();

    var videoInfos = JSON.stringify(me.data.videoInfo);
    var realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfos;

    if (user == null || user == undefined || user == '') {
      wx.redierctTo({
        url: '../userLogin/login?redirectUrl=' + realUrl,
      })
    } else {
      
      var userLikeVideo = me.data.userLikeVideo;
      var url = '/video/userLike?userId=' + user.id + '&videoId=' + videoInfo.id + '&videoCreaterId=' + videoInfo.userId;
      if (userLikeVideo) {
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
        success:function(res) {
          wx.hideLoading();
          if (res.data.status == 200) {
            if (userLikeVideo) {
              videoInfo.likeCounts -= 1;
            } else {
              videoInfo.likeCounts += 1;
            }
            me.setData({
              userLikeVideo: !userLikeVideo,
              videoInfo: videoInfo
            });

          } else if(res.data.status == 500) {
            wx.showToast({
              title: '出错了~~',
              icon: "none"
            });
          } else {
            wx.navigateTo({
              url: '../userLogin/login?redirectUrl=' + realUrl,
            })
          }
        }
      })


    }
  },

  shareMe: function() {
    var me = this;
    var user = app.getGlobalUserInfo();

    wx.showActionSheet({
      itemList: ['下载到本地', '举报用户', '分享到朋友圈', '分享到QQ空间', '分享到微博'],
      success: function(res) {
        console.log(res.tapIndex);
        if (res.tapIndex == 0) {
          // 下载
          wx.showLoading({
            title: '下载中...',
          })
          wx.downloadFile({
            url: app.serverUrl + me.data.videoInfo.videoPath,
            success: function (res) {
              // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
              if (res.statusCode === 200) {
                console.log(res.tempFilePath);

                wx.saveVideoToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success:function(res) {
                    console.log(res.errMsg)
                    wx.hideLoading();
                  }
                })
              }
            }
          })
        } else if (res.tapIndex == 1) {
          // 举报
          var videoInfo = JSON.stringify(me.data.videoInfo);
          var realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfo;

          if (user == null || user == undefined || user == '') {
            wx.navigateTo({
              url: '../userLogin/login?redirectUrl=' + realUrl,
            })
          } else {
            var publishUserId = me.data.videoInfo.userId;
            var videoId = me.data.videoInfo.id;
            var currentUserId = user.id;
            wx.navigateTo({
              url: '../report/report?videoId=' + videoId + "&publishUserId=" + publishUserId
            })
          }
        } else{
          wx.showToast({
            title: '官方暂未开放...',
          })
        } 
      }
    })
  },

  onShareAppMessage: function (res) {
    
    var me = this;
    var videoInfo = me.data.videoInfo;

    return {
      title: '短视频内容分析',
      path: "pages/videoinfo/videoinfo?videoInfo=" + JSON.stringify(videoInfo)
    }
  },


  replyFocus: function(e) {
    var fatherCommentId = e.currentTarget.dataset.fathercommentid;
    var toUserId = e.currentTarget.dataset.touserid;
    var toNickname = e.currentTarget.dataset.tonickname;
 
    this.setData({
      placeholder: "回复 @" + toNickname,
      replyFatherCommentId: fatherCommentId,
      replyToUserId: toUserId,
      inputFocus: true
    });
  },

  saveComment:function(e) {
    var me = this;
    var content = e.detail.value;

    // 获取评论回复的fatherCommentId和toUserId
    var fatherCommentId = e.currentTarget.dataset.replyfathercommentid;
    var toUserId = e.currentTarget.dataset.replytouserid;

    var user = app.getGlobalUserInfo();
    var videoInfo = JSON.stringify(me.data.videoInfo);
    var realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfo;

    if (user == null || user == undefined || user == '') {
      wx.navigateTo({
        url: '../userLogin/login?redirectUrl=' + realUrl,
      })
    } else {
      wx.showLoading({
        title: '请稍后...',
      })
      wx.request({
        url: app.serverUrl + '/video/saveComment?fatherCommentId=' + fatherCommentId + "&toUserId=" + toUserId,
        method: 'POST',
        header: {
          'content-type': 'application/json', // 默认值
          'headerUserId': user.id,
          'headerUserToken': user.userToken
        },
        data: {
          fromUserId: user.id,
          videoId: me.data.videoInfo.id,
          comment: content
        },
        success: function(res) {
          console.log(res.data)
          wx.hideLoading();
          if (res.data.status == 200) {
            me.setData({
              contentValue: "",
              commentsList: []
            });

            me.getCommentsList(1);
          } else if (res.data.status == 500) {
            wx.showToast({
              title: '出错了~~',
              icon: "none"
            });
          } else {
            wx.navigateTo({
              url: '../userLogin/login?redirectUrl=' + realUrl,
            })
          }
        }
      })
    }
  },

// commentsPage: 1,
//   commentsTotalPage: 1,
//   commentsList: []

    getCommentsList: function(page) {
      var me = this;
      var user = app.getGlobalUserInfo();
      var loginUserId = "";
      if (user != null && user != undefined && user != '') {
        loginUserId = user.id;
      }
      var videoId = me.data.videoInfo.id;
      wx.showLoading({
        title: '请稍后...',
      })
      wx.request({
        url: app.serverUrl + '/video/getVideoComments?videoId=' + videoId + "&page=" + page + "&pageSize=10" + "&loginUserId=" + loginUserId,
        method: "POST",
        success: function(res) {
          console.log(res.data);
          wx.hideLoading();
          var commentsList = res.data.data.rows;
          var newCommentsList = me.data.commentsList;

          me.setData({
            commentsList: newCommentsList.concat(commentsList),
            commentsPage: page,
            commentsTotalPage: res.data.data.total,
            commentRecords: res.data.data.records
          });
          commentsList = me.data.commentsList;
          var commentDetailLists = me.data.commentDetailLists;
          
          for (var i = 0; i < commentsList.length; i++) {
            commentDetailLists[i] = commentsList[i].commentDetailList.slice(0,1);
          }
          me.setData({
            commentDetailLists: commentDetailLists
          })
          if (commentsList == null || commentsList == "" || commentsList == undefined) {
            wx.showToast({
              title: '没有评论了~~',
              icon: "none"
            });
          }
        }
      })
    },

    onReachBottom: function() {
      
      var me = this;
      if (me.data.commentFocus) {
        var currentPage = me.data.commentsPage;
        var totalPage = me.data.commentsTotalPage;
        if (currentPage === totalPage) {
          wx.showToast({
            title: '没有评论了~~',
            icon: "none"
          });
          return;
        }
        var page = currentPage + 1;
        me.getCommentsList(page);
      }
    },

  //显示对话框
  showModal: function () {
    // 显示遮罩层
    var me = this;
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })

    me.animation = animation
    animation.translateY(300).step()
    me.setData({
      animationData: animation.export(),
      commentFocus: true
    })

    setTimeout(function () {
      animation.translateY(0).step()
      me.setData({
        animationData: animation.export()
      })
    }.bind(me), 200)

    me.setData({
      commentsList: []
    });
    me.getCommentsList(1);
  },

  //隐藏对话框
  hideModal: function () {
    // 隐藏遮罩层
    var me = this;
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })

    me.animation = animation
    animation.translateY(300).step()
    me.setData({
      animationData: animation.export(),
    })

    setTimeout(function () {
      animation.translateY(0).step()
      me.setData({
        animationData: animation.export(),
        commentFocus: false
      })
    }.bind(me), 200)
  },

  //输入聚焦
  foucus: function (e) {
    var me = this;
    me.setData({
      bottom: e.detail.height * 2.09
    })

  },

  //失去聚焦
  blur: function (e) {
    var me = this;
    me.setData({
      bottom: 0,
      placeholder: "留下你的精彩评论吧",
      replyFatherCommentId: "undefined",
      replyToUserId: "undefined"
    })
  },

  likeCommentsOrNot: function(e) {
    var me = this;
    var index = e.currentTarget.dataset.index;

    var commentId = e.currentTarget.dataset.commentid;
    var user = app.getGlobalUserInfo();

    var videoInfo = JSON.stringify(me.data.videoInfo);
    var realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfo;
    
    if (user == null || user == undefined || user == '') {
      wx.navigateTo({
        url: '../userLogin/login?redirectUrl=' + realUrl,
      })
    } else {

      var commentsList = me.data.commentsList;
      var url = '/video/likeComment?userId=' + user.id + '&commentId=' + commentId;
      if (commentsList[index].isPraise) {
        url = '/video/unlikeComment?userId=' + user.id + '&commentId=' + commentId;
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
            if (commentsList[index].isPraise) {
              commentsList[index].likeCounts -= 1;
            } else {
              commentsList[index].likeCounts += 1;
            }
            
            commentsList[index].isPraise = !commentsList[index].isPraise;
            
            me.setData({
              commentsList: commentsList
            })
          } else if (res.data.status == 500) {
            wx.showToast({
              title: '出错了~~',
              icon: "none"
            });
          } else {
            wx.navigateTo({
              url: '../userLogin/login?redirectUrl=' + realUrl,
            })
          }
        }
      })
    }
  },

  likeReplyCommentsOrNot: function(e) {
    var me = this;
    var index = e.currentTarget.dataset.index;
    var cellindex = e.currentTarget.dataset.cellindex;
    var commentId = e.currentTarget.dataset.commentid;
    var user = app.getGlobalUserInfo();

    var videoInfo = JSON.stringify(me.data.videoInfo);
    var realUrl = '../videoinfo/videoinfo#videoInfo@' + videoInfo;

    if (user == null || user == undefined || user == '') {
      wx.navigateTo({
        url: '../userLogin/login?redirectUrl=' + realUrl,
      })
    } else {

      var commentDetail = me.data.commentDetailLists[index][cellindex];

      var url = '/video/likeComment?userId=' + user.id + '&commentId=' + commentId;
      if (commentDetail.isPraise) {
        url = '/video/unlikeComment?userId=' + user.id + '&commentId=' + commentId;
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
            
            if (commentDetail.isPraise) {
              commentDetail.likeCounts -= 1;
            } else {
              commentDetail.likeCounts += 1;
            }

            var commentDetailLists = me.data.commentDetailLists;
            commentDetail.isPraise = !commentDetail.isPraise;
            commentDetailLists[index][cellindex] = commentDetail;

            me.setData({
              commentDetailLists: commentDetailLists
            })
          } else if (res.data.status == 500) {
            wx.showToast({
              title: '出错了~~',
              icon: "none"
            });
          } else {
            wx.redirectTo({
              url: '../userLogin/login?redirectUrl=' + realUrl,
            })
          }
        }
      })
    }
  },

  addReply: function(e) {
    wx.showLoading({
      title: '加载中...',
    })
    var me = this;
    var index = e.currentTarget.dataset.index;
    var length = e.currentTarget.dataset.length;
    var commentsList = me.data.commentsList;
    var commentDetailLists = me.data.commentDetailLists;
    if (length + 3 > commentsList[index].commentDetailList.length) {
      length = commentsList[index].commentDetailList.length;
    } else {
      length += 3;
    }
    commentDetailLists[index] = commentsList[index].commentDetailList.slice(0, length);
    me.setData({
      commentDetailLists: commentDetailLists
    });
    wx.hideLoading();
  },

  pickReply: function(e) {
    wx.showLoading({
      title: '请稍后...',
    })
    var me = this;
    var index = e.currentTarget.dataset.index;
    var commentsList = me.data.commentsList;
    var commentDetailLists = me.data.commentDetailLists;
    commentDetailLists[index] = commentsList[index].commentDetailList.slice(0, 1);
    me.setData({
      commentDetailLists: commentDetailLists
    });
    wx.hideLoading();
  }

})