import React, { useState } from 'react';
import axios from 'axios';
import { Button, Card, Upload, List, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const TMDB_API_KEY = '4e87c8c0234c83f5b845585ead3f56a5' //#####this key is from the task itself#####

function TMDBMovieUploader() {
  const [fileContent, setFileContent] = useState([]);
  const [movieData, setMovieData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result.split('\n').filter(Boolean).map(title => title.trim());
      setFileContent(content);
    };
    reader.readAsText(file);
    return false; 
  };

  const fetchMovieData = async () => {
    if (!fileContent.length) {
      message.warning('Please upload a file with movie titles.');
      return;
    }

    setIsSearching(true);
    
    try {
      const fetchedData = await Promise.all(
        fileContent.map(async (title) => {
          try {
            const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
              params: { api_key: TMDB_API_KEY, query: title }
            });
            const movie = response.data.results[0];
            if (movie) {
              const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
                params: { api_key: TMDB_API_KEY, append_to_response: 'credits,videos' }
              });
              return {
                id: detailsResponse.data.id,
                title: detailsResponse.data.title,
                overview: detailsResponse.data.overview,
                actors: detailsResponse.data.credits?.cast.slice(0, 5).map(actor => actor.name) || [],
                genres: detailsResponse.data.genres.map(genre => genre.name),
                poster: detailsResponse.data.poster_path ? `https://image.tmdb.org/t/p/w500${detailsResponse.data.poster_path}` : '',
                release: detailsResponse.data.release_date,
                rating: detailsResponse.data.vote_average,
                trailer: detailsResponse.data.videos?.results.find(video => video.type === 'Trailer')?.key,
                director: detailsResponse.data.credits?.crew.find(person => person.job === 'Director')?.name,
                duration: detailsResponse.data.runtime
              };
            }
          } catch (error) {
            console.error(`Error fetching data for "${title}":`, error);
            message.error(`Error fetching data for "${title}"`);
            return null;
          }
        })
      );
      
      setMovieData(fetchedData.filter(Boolean)); 
    } catch (error) {
      console.error('Error during data fetch process:', error);
      message.error('An error occurred while fetching movie data.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveMovie = (id) => {
    setMovieData(prevData => prevData.filter(movie => movie.id !== id));
    message.success('Movie removed successfully.');
  };

  const handleSaveData = async () => {
    if (!movieData.length) {
      message.warning('No movie data to save.');
      return;
    }
  
    try {
      const response = await axios.post('https://dummyendpoint.com/save', movieData, { timeout: 5000 })
      message.success('Data saved successfully!');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error saving data:', error);
      if (error.response) {
        message.error(`Error saving data: ${error.response.data.message || 'Please try again.'}`);
      } else if (error.request) {
        message.error('No response from the server. Please check your connection.');
      } else {
        message.error('An unexpected error occurred. Please try again.');
      }
    }
  };
  

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>TMDB Movie Uploader</h1>
      
      <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".txt">
        <Button icon={<UploadOutlined />}>Upload .txt File</Button>
      </Upload>
      
      {fileContent.length > 0 && (
        <>
          <h2>Movie Titles</h2>
          <List
            bordered
            dataSource={fileContent}
            renderItem={(title) => (<List.Item>{title}</List.Item>)}
          />
          <Button 
            type="primary" 
            onClick={isSearching ? null : (movieData.length > 0 ? handleSaveData : fetchMovieData)} 
            loading={isSearching} 
            style={{ marginTop: '20px' }}
          >
            {isSearching ? 'Searching...' : movieData.length > 0 ? 'Save Data' : 'Search Movies'}
          </Button>
        </>
      )}
      
      {movieData.length > 0 && (
        <>
          <h2>Movie Results</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {movieData.map((movie) => (
              <Card
                key={movie.id}
                hoverable
                cover={movie.poster ? <img src={movie.poster} alt={movie.title} /> : null}
                actions={[<DeleteOutlined key="delete" onClick={() => handleRemoveMovie(movie.id)} />]}
              >
                <Card.Meta title={movie.title} description={`Rating: ${movie.rating} / 10`} />
                <p><strong>Director:</strong> {movie.director || 'N/A'}</p>
                <p><strong>Release:</strong> {movie.release || 'N/A'}</p>
                <p><strong>Genres:</strong> {movie.genres.length ? movie.genres.join(', ') : 'N/A'}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TMDBMovieUploader;
