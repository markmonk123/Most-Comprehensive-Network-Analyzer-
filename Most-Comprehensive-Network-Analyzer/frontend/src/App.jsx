import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import NetworkAnalyzer from './components/NetworkAnalyzer';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/analyze" component={NetworkAnalyzer} />
      </Switch>
    </Router>
  );
};

export default App;