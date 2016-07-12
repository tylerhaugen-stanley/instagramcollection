var CollectionViewer = React.createClass({
  handleCollectionQuerySubmit: function(queryData){
    console.log(queryData);
  },
  render: function(){
    return (
      <div className="collectionViewer">
        <CollectionQuery handleCollectionQuerySubmit={this.handleCollectionQuerySubmit} />
        <Collection />
      </div>
    );
  }
});
var CollectionQuery = React.createClass({
  getInitialState: function(){
    return{queryType: 'createCollection', tag: '', startDate: '', endDate: ''};
  },
	handleSubmit: function(event){
    event.preventDefault();
    var queryType = this.state.queryType;
    var tag = this.state.tag.trim();
    var startDate = this.state.startDate.trim();
    var endDate = this.state.endDate.trim();

    // ensure all fields are filled out.
    if (!tag || !startDate || !endDate){
      return;
    }

    // Handle the actual query in the 'CollectionViewer'
    this.props.handleCollectionQuerySubmit({queryType: queryType, tag: tag, startDate: startDate, endDate: endDate});
  },
  handleRadioButtonChange: function(event){
    this.setState({queryType: event.target.id});
  },
  handleTagChange: function(event){
    this.setState({tag: event.target.value});
  },
  handleStartDateChange: function(event){
    this.setState({startDate: event.target.value});
  },
  handleEndDateChange: function(event){
    this.setState({endDate: event.target.value});
  },
  render: function(){
		return (
      <form onSubmit={this.handleSubmit}>
        <input type="radio" id="createCollection" name="queryType" onChange={this.handleRadioButtonChange} defaultChecked /> Create Collection
        <input type="radio" id="queryCollection" name="queryType" onChange={this.handleRadioButtonChange} /> Query Collection
        Instagram Tag: <input type="text" placeholder="#" value={this.state.tag} onChange={this.handleTagChange} />
        Start Date: <input type="date" name="startDate" value={this.state.startDate} onChange={this.handleStartDateChange} />
        End Date: <input type="date" name="endDate" value={this.state.endDate} onChange={this.handleEndDateChange} />
        Submit: <input type="submit" />
      </form>
    );
	}
});

var Collection = React.createClass({
  render: function(){
    return(
      <p> I Am A Collection </p>
    );
  }
});

ReactDOM.render(
  <CollectionViewer />,
  document.getElementById('content')
);