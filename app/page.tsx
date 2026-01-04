'use client';
// app/page.tsx
import React, { useRef, useState } from 'react';
import DropzoneComponent from './components/dropzone';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

type Inputs = {
  videoTitle: string;
  videoLength: string;
  thumbnailFileInput: File[];
  channelSubscribers: number;
  totalChannelViews: number;
  totalVideos: number;
  videoUploadDayofWeek: number;
  videoUploadHour: number;
  channelAgeYears: number;
};

export default function Home() {
  const dropzoneRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const submitToBackend = async (data: Inputs) => {
    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      // Prepare JSON data for FastAPI
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Thumbnail = reader.result?.toString().split(',')[1]; // remove "data:image/...;base64," prefix
        if (!base64Thumbnail) {
          setMessage('Error: Thumbnail is required');
          setLoading(false);
          return;
        }
        const jsonData = {
          videoTitle: data.videoTitle,
          videoLength: data.videoLength,
          channelSubscribers: data.channelSubscribers,
          totalChannelViews: data.totalChannelViews,
          totalVideos: data.totalVideos,
          videoUploadDayofWeek: data.videoUploadDayofWeek,
          videoUploadHour: data.videoUploadHour,
          channelAgeYears: data.channelAgeYears,
          thumbnail: base64Thumbnail,
        };

        const response = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData),
        });

        const responseData = await response.json();
        console.log(responseData.prediction);

        setResult(responseData.prediction);
        window.scrollTo(0, 0);
      };
      reader.readAsDataURL(data.thumbnailFileInput[0]);
    } catch (error) {
      setMessage(
        'Error: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const isValidVideoLength = (value: string): true | string => {
    const parts = value.split(':').map(Number);

    if (parts.some(isNaN)) {
      return 'Invalid time format';
    }

    let days = 0,
      hours = 0,
      minutes = 0,
      seconds = 0;

    if (parts.length === 2) {
      [minutes, seconds] = parts;
    } else if (parts.length === 3) {
      [hours, minutes, seconds] = parts;
    } else if (parts.length === 4) {
      [days, hours, minutes, seconds] = parts;
    } else {
      return 'Time must be MM:SS, HH:MM:SS, or DD:HH:MM:SS';
    }

    if (seconds >= 60) return 'Seconds must be less than 60';
    if (minutes >= 60) return 'Minutes must be less than 60';
    if (hours >= 24) return 'Hours must be less than 24';
    if (days >= 99) return 'Days must be less than 99';

    return true;
  };

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => submitToBackend(data);

  console.log(watch('videoLength')); // watch input value by passing the name of it

  return (
    <main>
      <h1 style={{ textAlign: 'center' }}>YouTube CTR Evaluator V1</h1>{' '}
      {result && (
        <h2>
          Your video will likely get{' '}
          <b>
            {(10 ** result).toLocaleString('en')}-
            {(10 ** (result + 1)).toLocaleString('en')}
          </b>{' '}
          views
        </h2>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='form-group'>
          <Controller
            name='thumbnailFileInput'
            control={control}
            defaultValue={[]}
            rules={{
              validate: (files) =>
                files.length === 1 || 'Exactly one image is required',
            }}
            render={({ field }) => (
              <DropzoneComponent
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.thumbnailFileInput && <span>File is required</span>}
        </div>

        <div className='form-group'>
          <label>Video Title:</label>
          <input
            {...register('videoTitle', { required: 'Video title is required' })}
            placeholder='Enter your video title'
            type='text'
          />
          {errors.videoTitle && <span>{errors.videoTitle.message}</span>}
        </div>

        <div className='form-group'>
          <label>Video Length (DD:HH:MM:SS):</label>
          <input
            defaultValue='10:10'
            type='text'
            {...register('videoLength', {
              required: 'Video length is required',
              validate: isValidVideoLength,
              pattern: {
                value: /^(?:\d{2}:)?(?:\d{2}:)?\d{2}:\d{2}$/,
                message:
                  'Video length must have format DD:HH:MM:SS, MM:SS is mandatory',
              },
            })}
            placeholder='00:00:00:00'
          />
          {errors.videoLength && <span>{errors.videoLength.message}</span>}
        </div>

        <div className='form-group'>
          <label>Channel Subscribers:</label>
          <input
            type='number'
            {...register('channelSubscribers', {
              required: 'Channel subscribers is required',
              valueAsNumber: true,
              min: {
                value: 0,
                message:
                  'Channel subscribers must be greater than or equal to 0',
              },
            })}
            placeholder='0'
          />
          {errors.channelSubscribers && (
            <span>{errors.channelSubscribers.message}</span>
          )}
        </div>

        <div className='form-group'>
          <label>Total Channel Views:</label>
          <input
            type='number'
            {...register('totalChannelViews', {
              required: 'Total channel views is required',
              valueAsNumber: true,
              min: {
                value: 0,
                message:
                  'Total channel views must be greater than or equal to 0',
              },
            })}
            placeholder='0'
          />
          {errors.totalChannelViews && (
            <span>{errors.totalChannelViews.message}</span>
          )}
        </div>

        <div className='form-group'>
          <label>Total Videos:</label>
          <input
            type='number'
            {...register('totalVideos', {
              required: 'Total videos is required',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Total videos must be greater than or equal to 0',
              },
            })}
            placeholder='0'
          />
          {errors.totalVideos && <span>{errors.totalVideos.message}</span>}
        </div>

        <div className='form-group'>
          <label>Video Upload Day of Week (0-6):</label>
          <input
            type='number'
            {...register('videoUploadDayofWeek', {
              required: 'Video upload day of week is required',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Day of week must be between 0 and 6',
              },
              max: {
                value: 6,
                message: 'Day of week must be between 0 and 6',
              },
            })}
            placeholder='0'
          />
          {errors.videoUploadDayofWeek && (
            <span>{errors.videoUploadDayofWeek.message}</span>
          )}
        </div>

        <div className='form-group'>
          <label>Video Upload Hour (0-23):</label>
          <input
            type='number'
            {...register('videoUploadHour', {
              required: 'Video upload hour is required',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Hour must be between 0 and 23',
              },
              max: {
                value: 23,
                message: 'Hour must be between 0 and 23',
              },
            })}
            placeholder='12'
          />
          {errors.videoUploadHour && (
            <span>{errors.videoUploadHour.message}</span>
          )}
        </div>

        <div className='form-group'>
          <label>Channel Age (Years since 2025):</label>
          <input
            type='number'
            {...register('channelAgeYears', {
              required: 'Channel age is required',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Channel age must be greater than or equal to 0',
              },
            })}
            placeholder='0'
          />
          {errors.channelAgeYears && (
            <span>{errors.channelAgeYears.message}</span>
          )}
        </div>

        <input
          type='submit'
          disabled={loading}
          value={loading ? 'Analyzing...' : 'Get Prediction'}
        />
      </form>
      {message && (
        <p
          className={`message ${
            message.includes('Error') ? 'error' : 'success'
          }`}>
          {message.includes('Error') ? '❌' : '✅'} {message}
        </p>
      )}
    </main>
  );
}
