//Since React is global, we need to disable this lint. Once the code is `webpack`-ed, it needs to be enabled again.
/*global React $ */

var dbQueryData =[];
var numImagesToDisplay = 33;
const imageIncrement = 33;

var CollectionViewer = React.createClass({
  getInitialState: function(){
    return{collectionData: []};
  },
  updateCollectionToDisplay: function(numImagesToDisplay){
    this.setState({collectionData: dbQueryData.slice(0, numImagesToDisplay)});
  },
  handleCollectionQuerySubmit: function(queryData){
    this.setState({collectionData: []});
    $('#loadMore').hide();
    $('#emptyQuery').hide();

    if (queryData.queryType == "createCollection"){
      $.ajax({
        type: "POST",
        url: "createCollection",
        data: queryData,
        success: function(data) {
          $('#loadingMessage').hide();
          this.setState({collectionData: JSON.parse(data).data});
        }.bind(this),
        error: function(xhr, status, err) {
        }.bind(this)
      });
    } else { // Must be a query on an existing collection
      numImagesToDisplay = imageIncrement; // New query, reset num images to show.
      $.ajax({
        type: "GET",
        url: "queryCollection",
        data: queryData,
        success: function(data) {
          $('#loadingMessage').hide();
          if (data.length != 0){ // Check for empty db query
            dbQueryData = data;
            $('#loadMore').show();
            this.updateCollectionToDisplay(numImagesToDisplay);
          } else {
            $('#emptyQuery').show();
          }
        }.bind(this),
        error: function(xhr, status, err) {
        }.bind(this)
      });
    }
  },
  render: function(){
    return (
      <div className="collectionViewer">
        <CollectionQuery handleCollectionQuerySubmit={this.handleCollectionQuerySubmit} />
        <Collection collectionData={this.state.collectionData} updateCollectionToDisplay={this.updateCollectionToDisplay}/>
      </div>
    );
  }
});

var CollectionQuery = React.createClass({
  getInitialState: function(){
    var curDate = new Date().toISOString().slice(0,10); // Set start and end date to the current date
    return{queryType: 'createCollection', hashtag: '', startDate: curDate, endDate: curDate};
  },
	handleSubmit: function(event){
    event.preventDefault();
    var queryType = this.state.queryType;
    var hashtag = this.state.hashtag.trim();
    var startDate = this.state.startDate.trim();
    var endDate = this.state.endDate.trim();


    if (startDate > endDate){
      
      alert("Start date cannot be greater than the end Date");
      return;
    }

    // Show a loading message while the query executes
    $('#loadingMessage').show();

    // Handle the actual query in the 'CollectionViewer'
    this.props.handleCollectionQuerySubmit({queryType: queryType, hashtag: hashtag, startDate: startDate, endDate: endDate});
  },
  handleRadioButtonChange: function(event){
    this.setState({queryType: event.target.id});
  },
  handlehashtagChange: function(event){
    this.setState({hashtag: event.target.value});
  },
  handleStartDateChange: function(event){
    this.setState({startDate: event.target.value}, function(){
      if (this.state.startDate > this.state.endDate){
        $("#startDate").css({"border-color": "red"});  
      } else {
        $("#startDate").css({"border-color": "initial"});  
      }
    });
  },
  handleEndDateChange: function(event){
    this.setState({endDate: event.target.value}, function (){
      if (this.state.startDate > this.state.endDate){
        $("#startDate").css({"border-color": "red"});  
      } else {
        $("#startDate").css({"border-color": "initial"});  
      }
    });
  },
  render: function(){
		return (
      <div id="queryDiv">
        <form onSubmit={this.handleSubmit}>
          <span id="querySelection">
            <input type="radio" id="createCollection" name="queryType" onChange={this.handleRadioButtonChange} defaultChecked/> Create Collection          
          </span>
          <span id="">
            <input type="radio" id="queryCollection" name="queryType" onChange={this.handleRadioButtonChange} /> Load Collection
          </span>
          <span id="hashtag">
            Instagram Hashtag: <input type="text" placeholder="#puppy" value={this.state.hashtag} onChange={this.handlehashtagChange} required/>
          </span>
          <span id="startDateWrapper">
            Start Date: <input id="startDate" type="date" name="startDate" value={this.state.startDate} onChange={this.handleStartDateChange} />
          </span>
          <span id="endDate">
            End Date: <input type="date" name="endDate" value={this.state.endDate} onChange={this.handleEndDateChange} />
          </span>
          <br/> <input id="submitButton" type="submit" />
        </form>
        <p id='loadingMessage' hidden>Loading...</p>
        <p id='emptyQuery' hidden>No collection with that hashtag, check date range or hashtag.</p>
      </div>
    );
  }
});

var Collection = React.createClass({
  loadMore: function () {
    numImagesToDisplay += imageIncrement;
    if (numImagesToDisplay > dbQueryData.length) {
      $('#loadMore').hide();
    }
    this.props.updateCollectionToDisplay(numImagesToDisplay);
  },

  renderInstagramPostNode(instagramPost) {
    if (instagramPost.tag_time) {
      return (
        <DatabaseInstagramPost instagramPost={instagramPost}/>
      );
    } else {
      return (
        <ApiInstagramPost instagramPost={instagramPost}/>
      );
    }
  },

  render: function () {
    var instagramNodes = this.props.collectionData.map(this.renderInstagramPostNode);

    return (
      <div>
        {instagramNodes}
        <br />
        <button id='loadMore' hidden='true' onClick={this.loadMore} name="Load More">Load more</button>
      </div>
    );
  }
});

var DatabaseInstagramPost = React.createClass({
  render: function () {
    var instagramPost = this.props.instagramPost;
    return (
      <Media author={instagramPost.username}
             media_type={instagramPost.media_type}
             media={instagramPost.media_url}
             original_link={instagramPost.original_url}
             key={instagramPost.id}/>
    );
  }
});

var ApiInstagramPost = React.createClass({
  mediaUrl: function () {
    var instagramPost = this.props.instagramPost;
    var postType = instagramPost.type;

    return instagramPost[postType === "image" ? 'images' : 'videos'].standard_resolution.url;
  },

  render: function () {
    var instagramPost = this.props.instagramPost;
    return (
      <Media author={instagramPost.user.username}
             media_type={instagramPost.type}
             media={this.mediaUrl()}
             original_link={instagramPost.link}
             key={instagramPost.id}/>
    );
  }
});

var Media = React.createClass({
  renderMediaHeader: function () {
    return (
      <header id='mediaHeader'>
        <a id="author" target="_blank" href={"https://instagram.com/".concat(this.props.author)}>{this.props.author}</a>
        <a id="instagramLink" target="_blank" href={this.props.original_link}>Instagram link</a> <br />
      </header>
    );
  },

  renderMediaContentBlock: function (media) {
    return (
      <div>
        {this.renderMediaHeader()}
        <div id="mediaDiv">
          {media}
        </div>
      </div>
    );
  },

  renderImageWithHeader: function () {
    return this.renderMediaContentBlock(
      <div>
        <img id="media" height="640px" width="640px" src={this.props.media}/> <br />
      </div>
    );
  },

  renderVideoWithHeader: function (header) {
    return this.renderMediaContentBlock(
      <video id="media" height="640px" width="640px" controls>
        <source src={this.props.media} type="video/mp4"/>
      </video>
    );
  },

  render: function () {
    if (this.props.media_type === "image") {
      return this.renderImageWithHeader(header);
    } else { // Need to display a video
      return this.renderVideoWithHeader(header);
    }
  }
});

ReactDOM.render(
  <CollectionViewer />,
  document.getElementById('content')
);
