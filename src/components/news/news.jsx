import NewsHeader from 'common/news-header/news-header';
import Scroll from 'common/scroll/scroll';
import Loading from 'common/loading/loading'
import React, {Component} from 'react';
import {getNews} from 'api/index';
import './news.styl';

class News extends Component {

  state = {
    data: {},
    interval: 1
  };

  componentWillMount() {
    getNews(this.props.match.params.newsId)
      .then((response) => {
        this.setState({
          data: response
        });
        Loading.hideLoading('loadingWrapper');
      })
      .catch((error) => {
        console.error('内部错误，错误原因: ' + error);
      })
  }

  // 保证拥有数据后正确创建头部
  componentDidUpdate(prevProps, prevState) {
    if (this.state.data !== prevState.data) {
      this.createHeader();
    }
  }

  createHeader() {
    // 给顶部的 div 设置背景图片以及样式
    let img = this.state.data.image;
    let wrapper = document.getElementsByClassName('img-place-holder')[0];
    // 主题列表部分有些没有图片，所以对其进行一次判断
    if (wrapper) {
      wrapper.style.background = `url(${img.replace(/^\w+/, 'https')}) center no-repeat`;
      wrapper.style.backgroundSize = 'cover';
      // 给顶部的 div 里设置 title 以及遮罩层
      let title = document.createElement('em');
      title.setAttribute('class', 'news-title');
      title.textContent = this.state.data.title;
      wrapper.appendChild(title);
      // 图片来源
      let imgSource = document.createElement('em');
      imgSource.setAttribute('class', 'news-source');
      imgSource.textContent = this.state.data.image_source;
      wrapper.appendChild(imgSource);
      // 遮罩层
      let layer = document.createElement('div');
      layer.setAttribute('class', 'news-layer');
      wrapper.appendChild(layer);
    }
  }

  handleEmit() {
    this.props.history.goBack();
  }

  render() {
    let css, body;
    if (this.state.data.css) {
      css = this.state.data.css.map((css) => {
        return (
          <link rel="stylesheet" href={css.replace(/^\w+/, 'https')} key={this.state.data.id} />
        );
      });
      body = this.state.data.body.replace(/h\w+:\/\//g, 'https://');
    }

    return (
      <div>
        {css}
        <NewsHeader handleClick={this.handleEmit.bind(this)} />
        <Scroll className="news-scroll" id="newsScroll">
          <div dangerouslySetInnerHTML={{__html: body}} />
        </Scroll>
        <div className="loading-wrapper" id="loadingWrapper">
          <Loading />
        </div>
      </div>
    );
  }
}

export default News;