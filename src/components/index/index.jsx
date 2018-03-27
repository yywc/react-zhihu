import MHeader from 'common/m-header/m-header';
import Banner from 'common/banner/banner';
import ListView from 'common/list-view/list-view';
import Scroll from 'common/scroll/scroll';
import Loading from 'common/loading/loading'
import Sidebar from 'common/sidebar/sidebar'
import React, {Component} from 'react';
import {getLatest, getPreviousNews, getThemes} from 'api/index';
import {prefixStyle} from "assets/js/dom";
import './index.styl'

class Index extends Component {
  state = {
    newsId: 0,
    nowDate: 0,
    themeData: [],
    headerTitle: '首页',
    scrollRefresh: 0,
    bannerData: {
      topList: [],
      handleClick: {}
    },
    listViewData: {
      viewList: [],
      date: [],
      handleClick: {}
    },
    scrollEvent: {
      scrollToEnd: {},
      scroll: {}
    }
  };

  static transform = prefixStyle('transform');
  static listenScrollRealTime = 3;
  static animationDelay = 300;
  static scrollDistance = 60;
  static scrollAnimationDuration = 700;

  componentWillMount() {
    getLatest()
      .then((response) => {
        this.setState({
          bannerData: {
            topList: response.top_stories,
            handleClick: this.handleEmit.bind(this)
          },
          listViewData: {
            // 数据封装成 result 风格
            viewList: [{date: response.date}].concat(response.stories),
            handleClick: this.handleEmit.bind(this)
          },
          nowDate: response.date
        });
        Loading.hideLoading('loadingWrapper');
        document.getElementById('listLoading').style.display = 'block';
      })
      .catch((error) => {
        console.error('内部错误，错误原因: ' + error);
      });

    getThemes()
      .then((response) => {
        this.setState({
          themeData: response.others
        });
      })
      .catch((error) => {
        console.error('内部错误，错误原因: ' + error);
      });

    this.setState({
      scrollEvent: {
        // 不 bind this 就无法再函数里使用指向 ProxyComponent 的 this 关键字
        scrollToEnd: this.scrollToEnd.bind(this),
        scroll: this.scroll.bind(this)
      }
    });
  }

  handleScrollWrapperTouchStart(e) {
    this.startY = e.touches[0].pageY;
    this.startX = e.touches[0].pageX;
  }

  handleScrollWrapperTouchMove(e) {
    this.endY = e.touches[0].pageY;
    this.endX = e.touches[0].pageX;
    let sidebar = this.refs.sidebarWrapper.children[0];
    let deltaX = this.endX - this.startX;
    if (this.startX < 10 && deltaX > 0) {
      this.translateInPercent = parseInt((deltaX / window.innerWidth) * 100, 10);
      let backgroundOpacity = 0.3 * (this.translateInPercent / 100);
      if (backgroundOpacity > 0.3) {
        backgroundOpacity = 0.3
      }
      this.refs.sidebarWrapper.style.display = 'block';
      setTimeout(() => {
        let percent = (-100 + this.translateInPercent);
        if (percent > 0) {
          percent = 0;
        }
        sidebar.style[Index.transform] = `translate3d(${percent}%,0,0)`;
        this.refs.sidebarWrapper.style.background = `rgba(0,0,0,${backgroundOpacity})`
      }, 1);
    }
  }

  handleScrollWrapperTouchEnd() {
    let sidebar = this.refs.sidebarWrapper.children[0];
    let sidebarWrapper = this.refs.sidebarWrapper;
    if (this.translateInPercent >= 50) {
      sidebar.style[Index.transform] = `translate3d(0,0,0)`;
    } else if (this.translateInPercent < 50) {
      sidebar.style[Index.transform] = `translate3d(-100%,0,0)`;
      setTimeout(() => {
        sidebarWrapper.style.display = 'none';
      }, Index.animationDelay / 2);
    }
  }

  handleSidebarTouchStart(e) {
    this.xStart = e.touches[0].pageX;
  }

  handleSidebarTouchMove(e) {
    // 注意最开始使用 e.target 造成了BUG，原因是 e.target 是触摸的元素，而不是我想要操作的外层 wrapper
    this.xEnd = e.touches[0].pageX;
    let xDelta = this.xEnd - this.xStart;
    let sidebar = this.refs.sidebarWrapper.children[0];
    if (xDelta < 0) {
      this.translateOutPercent = parseInt(((-xDelta) / sidebar.clientWidth) * 100, 10);
      let backgroundOpacity = 0.3 * (1 - (this.translateOutPercent / 100));
      if (backgroundOpacity < 0) {
        backgroundOpacity = 0;
      }
      if (this.translateOutPercent > 100) {
        this.translateOutPercent = 100;
      }
      sidebar.style[Index.transform] = `translate3d(-${this.translateOutPercent}%,0,0)`;
      this.refs.sidebarWrapper.style.background = `rgba(0,0,0,${backgroundOpacity})`
    }
  }

  handleSidebarTouchEnd() {
    let sidebar = this.refs.sidebarWrapper.children[0];
    let sidebarWrapper = this.refs.sidebarWrapper;
    if (this.translateOutPercent >= 50) {
      sidebar.style[Index.transform] = `translate3d(-100%,0,0)`;
      setTimeout(() => {
        sidebarWrapper.style.display = 'none';
      }, Index.animationDelay / 2);
    } else if (this.translateOutPercent < 50) {
      sidebar.style[Index.transform] = `translate3d(0,0,0)`;
    }
  }

  handleEmit(newsItem) {
    this.props.history.push('/news/' + newsItem.id);
  }

  handleDoubleClick() {
    let targetEle = document.getElementById('scrollWrapper');
    // 通过 refs 取得 scroll 组件，从而得以调用 scroll 组件的 scrollToElement 方法
    this.refs.listScroll.scrollToElement(targetEle, Index.scrollAnimationDuration)
  }

  handleClickOfSidebar() {
    // 为了引发 scroll 中 state 的变化，从而使得 scroll refresh
    this.setState({
      scrollRefresh: 0
    });
    let sidebarWrapper = document.getElementById('sidebarWrapper');
    sidebarWrapper.style.background = `transparent`;
    // sidebar主体
    let sidebar = sidebarWrapper.children[0];
    sidebar.style[Index.transform] = `translate3d(-100%,0,0)`;
    // 保证动画效果，延迟时间与动画时一致
    setTimeout(() => {
      sidebarWrapper.style.display = `none`;
    }, Index.animationDelay);
  }

  handleClickOfMHeader() {
    // 为了引发 scroll 中 state 的变化，从而使得 scroll refresh
    this.setState({
      scrollRefresh: 1
    });
    let sidebarWrapper = document.getElementById('sidebarWrapper');
    sidebarWrapper.style.display = `block`;
    // 保证动画效果
    setTimeout(() => {
      sidebarWrapper.style.background = `rgba(0,0,0,0.3)`;
      // sidebar主体
      let sidebar = sidebarWrapper.children[0];
      sidebar.style[Index.transform] = `translate3d(0,0,0)`;
    }, Index.animationDelay / 10);
  }

  scrollToEnd() {
    getPreviousNews(this.state.nowDate)
      .then((response) => {
        // 简单 alert 一下好了，一般没人能坚持翻到 2013 年吧。
        if (response.date === '20130520') {
          return alert('没有更多消息了');
        } else {
          this.setState({
            nowDate: response.date,
            listViewData: {
              // 数据封装成 result 风格
              viewList: this.state.listViewData.viewList.concat([{date: response.date}].concat(response.stories)),
              handleClick: this.handleEmit.bind(this),
            }
          });
        }
      })
      .catch((error) => {
        console.error('内部错误，错误原因: ' + error);
      });
  }

  scroll(position) {
    if (position.y > -Index.scrollDistance && this.state.headerTitle !== '首页') {
      this.setState({
        headerTitle: '首页'
      });
    } else {
      let dates = document.getElementsByClassName('list-date');
      for (let i = 0; i < dates.length; i++) {
        if (this.startY > this.endY && this.state.headerTitle !== dates[i].textContent) {
          let rec = dates[i].getBoundingClientRect();
          // 加个大于是为了性能优化，在手机上快速滚动卡的要命(大量 state变化导致重新 render)
          if (rec.top < Index.scrollDistance && rec.top > (-window.innerHeight + Index.scrollDistance)) {
            this.setState({
              headerTitle: dates[i].textContent
            });
          }
        } else if (i !== 0 && this.startY < this.endY && this.state.headerTitle !== dates[i - 1].textContent) {
          let top = dates[i].getBoundingClientRect().top;
          // 小于是为了限制最后一个 list-item 一直满足条件而使得满足条件的当前 list-item 不能崭露头角
          if (top < (window.innerHeight - Index.scrollDistance) && top > Index.scrollDistance) {
            this.setState({
              headerTitle: dates[i - 1].textContent
            });
          }
        }
      }
    }
  }

  render() {
    return (
      <div>
        <MHeader title={this.state.headerTitle}
                 emitClick={this.handleClickOfMHeader.bind(this)}
                 emitDoubleClick={this.handleDoubleClick.bind(this)} />
        <div className="scroll-wrapper"
             id="scrollWrapper"
             ref="scrollWrapper"
             onTouchStart={(e) => {
               this.handleScrollWrapperTouchStart(e);
             }}
             onTouchMove={(e) => {
               this.handleScrollWrapperTouchMove(e);
             }}
             onTouchEnd={() => {
               this.handleScrollWrapperTouchEnd();
             }}>
          <Scroll className="list-scroll"
                  id="listScroll"
                  ref="listScroll"
                  probeType={Index.listenScrollRealTime}
                  scrollEvent={this.state.scrollEvent}>
            <div className="slider-wrapper" id="sliderWrapper">
              <div className="slider-content">
                <Banner bannerData={this.state.bannerData} />
              </div>
            </div>
            <ListView listViewData={this.state.listViewData} />
            <div className="list-loading" id="listLoading">
              <Loading title="" />
            </div>
          </Scroll>
        </div>
        <div className="loading-wrapper" id="loadingWrapper">
          <Loading />
        </div>
        <div className="sidebar-wrapper"
             id="sidebarWrapper"
             ref="sidebarWrapper"
             onTouchStart={(e) => {
               this.handleSidebarTouchStart(e)
             }}
             onTouchMove={(e) => {
               this.handleSidebarTouchMove(e)
             }}
             onTouchEnd={() => {
               this.handleSidebarTouchEnd()
             }}
             onClick={() => {
               this.handleClickOfSidebar()
             }}>
          <Sidebar themeData={this.state.themeData} />
        </div>
      </div>
    );
  }
}

export default Index;