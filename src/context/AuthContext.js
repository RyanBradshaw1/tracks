import createDataContext from './createDataContext';
import trackerApi from '../api/tracker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../navigationRef';

// called when we call dispatch
const authReducer = (state, action) => {
    switch (action.type) {
        case 'add_error':
            // re-render whole app with old state and updated errorMessage
            return { ...state, errorMessage: action.payload };
        case 'signin':
            // when user signs up, set token and remove any error message
            return { errorMessage: '', token: action.payload };
        case 'clear_error_message':
            // for just removing error message like between signin and signup
            return { ...state, errorMessage: '' };
        case 'signout':
            return { token: null, errorMessage: '' }
        default:
            return state;
    }
};

// look for token already on user's device, navigate to track list screen if one is found
const tryLocalSignin = dispatch => async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        dispatch({ type: 'signin', payload: token });
        navigate('TrackList');
    } else {
        navigate('loginFlow');
    }
};

// dispatch action to clear error message
const clearErrorMessage = dispatch => () => {
    dispatch({ type: 'clear_error_message' });
};

const signup = dispatch => async ({ email, password }) => {
    try {
        // make request
        const response = await trackerApi.post('/signup', { email, password });
        // store token
        await AsyncStorage.setItem('token', response.data.token);
        // dispatch action to update state
        dispatch({ type: 'signin', payload: response.data.token });
        // navigate to TrackListScreen
        navigate('TrackList');
        // dispatch action to handle error
    } catch (err) {
        dispatch({ type: 'add_error', payload: 'Something went wrong with sign up.' });
    }
};

const signin = dispatch => async ({ email, password }) => {
    try {
        // try to sign in
        const response = await trackerApi.post('/signin', { email, password });
        // store token
        await AsyncStorage.setItem('token', response.data.token);
        // dispatch action to update state
        dispatch({ type: 'signin', payload: response.data.token })
        // navigate to TrackListScreen
        navigate('TrackList');
        // dispatch action to handle error
    } catch (err) {
        dispatch({ type: 'add_error', payload: 'Something went wrong with sign in.' });
    }
};

const signout = dispatch => async () => {
    await AsyncStorage.removeItem('token');
    dispatch({ type: 'signout' })
    navigate('loginFlow');
};

export const { Provider, Context } = createDataContext(
    authReducer,
    { signin, signout, signup, clearErrorMessage, tryLocalSignin },
    { token: null, errorMessage: '' }
);