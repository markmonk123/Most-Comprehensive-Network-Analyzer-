import React, { useState } from "react";
import axios from "axios";

function App() {
  const [ip, setIP] = useState("");
    const [results, setResults] = useState(null);
      const [error, setError] = useState(null);

        const queryBackend = async (endpoint) => {
            try {
                  const response = await axios.post(`http://localhost:5000/api/${endpoint}`, { ip });
                        setResults(response.data);
                              setError(null);
                                  } catch (err) {
                                        setError(`Error querying ${endpoint}: ${err.message}`);
                                            }
                                              };

                                                return (
                                                    <div>
                                                          <h1>Network Analyzer</h1>
                                                                <input
                                                                        type="text"
                                                                                placeholder="Enter IP (IPv4/IPv6)"
                                                                                        value={ip}
                                                                                                onChange={(e) => setIP(e.target.value)}
                                                                                                      />
                                                                                                            <button onClick={() => queryBackend("mac")}>Get MAC</button>
                                                                                                                  <button onClick={() => queryBackend("ripe")}>RIPEstat Data</button>
                                                                                                                        <button onClick={() => queryBackend("traceroute")}>Traceroute</button>
                                                                                                                              {error && <p style={{ color: "red" }}>{error}</p>}
                                                                                                                                    {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
                                                                                                                                        </div>
                                                                                                                                          );
                                                                                                                                          }

                                                                                                                                          export default App;