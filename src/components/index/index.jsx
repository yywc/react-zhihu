import MHeader from 'common/m-header/m-header'
import Banner from 'common/banner/banner'
import ListView from 'common/list-view/list-view'
import Scroll from 'common/scroll/scroll'
import Loading from 'common/loading/loading'
import Sidebar from 'common/sidebar/sidebar'
import React, { Component, Fragment } from 'react'
import { getLatest, getPreviousNews, getThemes } from 'api/index'
import { prefixStyle } from 'assets/js/utils'
import { sidebarClickIn, sidebarClickOut } from 'assets/js/common'
import { changeHeadTitle } from 'store/action-creators'
import { connect } from 'react-redux'
import './index.styl'

class Index extends Component {
  constructor(props) {
    super(props)
    this.state = {
      newsId: 0,
      nowDate: 0,
      themeData: [],
      headerTitle: '首页',
      scrollRefresh: 0,
      bannerData: {
        topList: []
      },
      listViewData: {
        viewList: []
      },
      scrollEvent: {
        scrollToEnd: {},
        scroll: {}
      }
    }
    this.handleClickOfMHeader = this.handleClickOfMHeader.bind(this)
    this.handleDoubleClick = this.handleDoubleClick.bind(this)
    this.scrollToEnd = this.scrollToEnd.bind(this)
    this.scroll = this.scroll.bind(this)
    this.handleListViewWrapperTouchStart = this.handleListViewWrapperTouchStart.bind(this)
    this.handleListViewWrapperTouchMove = this.handleListViewWrapperTouchMove.bind(this)
    this.handleListViewWrapperTouchEnd = this.handleListViewWrapperTouchEnd.bind(this)
    this.handleSidebarTouchStart = this.handleSidebarTouchStart.bind(this)
    this.handleSidebarTouchMove = this.handleSidebarTouchMove.bind(this)
    this.handleSidebarTouchEnd = this.handleSidebarTouchEnd.bind(this)
    this.handleClickOfSidebar = this.handleClickOfSidebar.bind(this)
  }

  static transform = prefixStyle('transform')
  static listenScrollRealTime = 3
  static animationDelay = 200
  static scrollDistance = 60
  static scrollAnimationDuration = 700

  componentWillMount() {
    getLatest()
      .then((response) => {
        this.setState({
          bannerData: {
            topList: response.top_stories
          },
          listViewData: {
            // 数据封装成 result 风格
            viewList: [{ date: response.date }].concat(response.stories)
          },
          nowDate: response.date
        })
        Loading.hideLoading('loadingWrapper')
        Loading.showLoading('listLoading')
      })
      .catch((error) => {
        console.error('内部错误，错误原因: ' + error)
      })

    getThemes()
      .then((response) => {
        this.setState({
          themeData: response.others
        })
      })
      .catch((error) => {
        console.error('内部错误，错误原因: ' + error)
      })

    this.setState({
      scrollEvent: {
        // 不 bind this 就无法再函数里使用指向 ProxyComponent 的 this 关键字
        scrollToEnd: this.scrollToEnd,
        scroll: this.scroll
      }
    })
  }

  componentWillReceiveProps() {
    // 在 index 页面点击 sidebar 里的首页时隐藏
    sidebarClickOut()
  }

  handleListViewWrapperTouchStart(e) {
    this.startY = e.touches[0].pageY
    this.startX = e.touches[0].pageX
  }

  handleListViewWrapperTouchMove(e) {
    this.endY = e.touches[0].pageY
    this.endX = e.touches[0].pageX
    let sidebar = this.refs.sidebarWrapper.children[0]
    let deltaX = this.endX - this.startX
    if (this.startX < 10 && deltaX > 0) {
      this.translateInPercent = parseInt((deltaX / window.innerWidth) * 100, 10)
      let backgroundOpacity = 0.3 * (this.translateInPercent / 100)
      if (backgroundOpacity > 0.3) {
        backgroundOpacity = 0.3
      }
      this.refs.sidebarWrapper.style.display = 'block'
      let percent = (-100 + this.translateInPercent)
      if (percent > 0) {
        percent = 0
      }
      sidebar.style[Index.transform] = `translate3d(${percent}%,0,0)`
      this.refs.sidebarWrapper.style.background = `rgba(0,0,0,${backgroundOpacity})`
    }
  }

  handleListViewWrapperTouchEnd() {
    let sidebar = this.refs.sidebarWrapper.children[0]
    let sidebarWrapper = this.refs.sidebarWrapper
    if (this.translateInPercent >= 50) {
      sidebar.style[Index.transform] = 'translate3d(0,0,0)'
      sidebarWrapper.style.background = 'rgba(0,0,0,0.3)'
    } else if (this.translateInPercent < 50) {
      sidebar.style[Index.transform] = 'translate3d(-100%,0,0)'
      sidebarWrapper.style.background = 'transparent'
      if (this.listViewWrapperTimer) {
        clearTimeout(this.listViewWrapperTimer)
      }
      this.listViewWrapperTimer = setTimeout(() => {
        sidebarWrapper.style.display = 'none'
      }, Index.animationDelay)
    }
  }

  handleSidebarTouchStart(e) {
    // 为了引发 scroll 中 state 的变化，从而使得 scroll refresh
    this.setState({
      scrollRefresh: 2
    })
    this.xStart = e.touches[0].pageX
    this.YStart = e.touches[0].pageY
  }

  handleSidebarTouchMove(e) {
    // 注意最开始使用 e.target 造成了BUG，原因是 e.target 是触摸的元素，而不是我想要操作的外层 wrapper
    this.xEnd = e.touches[0].pageX
    this.YEnd = e.touches[0].pageY
    if (Math.abs(this.YEnd - this.YStart) < 100) {
      let xDelta = this.xEnd - this.xStart
      let sidebar = this.refs.sidebarWrapper.children[0]
      if (xDelta < 0) {
        this.translateOutPercent = parseInt(((-xDelta) / sidebar.clientWidth) * 100, 10)
        let backgroundOpacity = 0.3 * (1 - (this.translateOutPercent / 100))
        if (backgroundOpacity < 0) {
          backgroundOpacity = 0
        }
        if (this.translateOutPercent > 100) {
          this.translateOutPercent = 100
        }
        sidebar.style[Index.transform] = `translate3d(-${this.translateOutPercent}%,0,0)`
        this.refs.sidebarWrapper.style.background = `rgba(0,0,0,${backgroundOpacity})`
      }
    }
  }

  handleSidebarTouchEnd() {
    let sidebar = this.refs.sidebarWrapper.children[0]
    let sidebarWrapper = this.refs.sidebarWrapper
    if (this.translateOutPercent >= 50) {
      sidebar.style[Index.transform] = 'translate3d(-100%,0,0)'
      sidebarWrapper.style.background = 'transparent'
      if (this.sidebarScrollTimer) {
        clearTimeout(this.sidebarScrollTimer)
      }
      this.sidebarScrollTimer = setTimeout(() => {
        sidebarWrapper.style.display = 'none'
      }, Index.animationDelay)
    } else if (this.translateOutPercent < 50) {
      sidebar.style[Index.transform] = 'translate3d(0,0,0)'
      sidebarWrapper.style.background = 'rgba(0,0,0,0.3)'
    }
  }

  handleDoubleClick() {
    let targetEle = document.getElementById('listScroll')
    // 通过 refs 取得 scroll 组件，从而得以调用 scroll 组件的 scrollToElement 方法
    this.refs.listScroll.scrollToElement(targetEle, Index.scrollAnimationDuration)
  }

  handleClickOfSidebar(e) {
    let sidebarWrapper = document.getElementById('sidebarWrapper')
    if (e.target === sidebarWrapper) {
      // 为了引发 scroll 中 state 的变化，从而使得 scroll refresh
      this.setState({
        scrollRefresh: 0
      })
      sidebarClickOut()
    }
  }

  handleClickOfMHeader() {
    // 为了引发 scroll 中 state 的变化，从而使得 scroll refresh
    this.setState({
      scrollRefresh: 1
    })
    sidebarClickIn()
  }

  scrollToEnd() {
    getPreviousNews(this.state.nowDate)
      .then((response) => {
        // 简单 alert 一下好了，一般没人能坚持翻到 2013 年吧。
        if (response.date === '20130520') {
          return alert('没有更多消息了')
        } else {
          this.setState({
            nowDate: response.date,
            listViewData: {
              // 数据封装成 result 风格
              viewList: this.state.listViewData.viewList.concat([{ date: response.date }].concat(response.stories))
            }
          })
        }
      })
      .catch((error) => {
        console.error('内部错误，错误原因: ' + error)
      })
  }

  scroll(position) {
    if (position.y > -Index.scrollDistance && this.props.headerTitle !== '首页') {
      this.props.handleChangeHeadTitle('首页')
    } else {
      let dates = document.getElementsByClassName('list-date')
      for (let i = 0; i < dates.length; i++) {
        if (this.startY > this.endY && this.props.headerTitle !== dates[i].textContent) {
          let rec = dates[i].getBoundingClientRect()
          // 加个大于是为了性能优化，在手机上快速滚动卡的要命(大量 state变化导致重新 render)
          if (rec.top < Index.scrollDistance && rec.top > (-window.innerHeight + Index.scrollDistance)) {
            this.props.handleChangeHeadTitle(dates[i].textContent)
          }
        } else if (i !== 0 && this.startY < this.endY && this.props.headerTitle !== dates[i - 1].textContent) {
          let top = dates[i].getBoundingClientRect().top
          // 小于是为了限制最后一个 list-item 一直满足条件而使得满足条件的当前 list-item 不能崭露头角
          if (top < (window.innerHeight - Index.scrollDistance) && top > Index.scrollDistance) {
            this.props.handleChangeHeadTitle(dates[i - 1].textContent)
          }
        }
      }
    }
  }

  render() {
    const {
      scrollEvent,
      bannerData,
      listViewData,
      themeData
    } = this.state

    return (
      <Fragment>
        <MHeader
          title={this.props.headerTitle}
          icon="icon-setting"
          emitClick={this.handleClickOfMHeader}
          emitDoubleClick={this.handleDoubleClick} />
        <Scroll
          className="list-scroll"
          id="listScroll"
          ref="listScroll"
          probeType={Index.listenScrollRealTime}
          scrollEvent={scrollEvent}>
          <div className="slider-wrapper" id="sliderWrapper">
            <div className="slider-content">
              <Banner bannerData={bannerData} />
            </div>
          </div>
          <div
            id="listViewWrapper"
            ref="listViewWrapper"
            onTouchStart={this.handleListViewWrapperTouchStart}
            onTouchMove={this.handleListViewWrapperTouchMove}
            onTouchEnd={this.handleListViewWrapperTouchEnd}>
            <ListView listViewData={listViewData} />
          </div>
          <div className="list-loading" id="listLoading">
            <Loading title="" />
          </div>
        </Scroll>
        <div className="loading-wrapper" id="loadingWrapper">
          <Loading />
        </div>
        <div
          className="sidebar-wrapper"
          id="sidebarWrapper"
          ref="sidebarWrapper"
          onTouchStart={this.handleSidebarTouchStart}
          onTouchMove={this.handleSidebarTouchMove}
          onTouchEnd={this.handleSidebarTouchEnd}
          onClick={this.handleClickOfSidebar}>
          <Sidebar themeData={themeData} />
        </div>
      </Fragment>
    )
  }
}

const mapStateToProps = function (state) {
  return {
    headerTitle: state.get('headerTitle')
  }
}

const mapDispatchToProps = function (dispatch) {
  return {
    handleChangeHeadTitle(data) {
      dispatch(changeHeadTitle(data))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Index)