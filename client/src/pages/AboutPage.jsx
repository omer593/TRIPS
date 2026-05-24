import React from 'react';

const AboutPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen  px-4">
      <div className="max-w-4xl text-center p-8 text-gray-800">
        <h1 className="text-4xl font-bold mb-6 text-blue-700">About AI Trip Planner</h1>
        <p className="mb-4 text-lg">
          Welcome to <strong>AI Trip Planner</strong> — your smart travel assistant built to help adventurers plan unforgettable hiking and cycling journeys.
        </p>
        <p className="mb-4 text-lg">
          Our journey began with a simple idea: <em>planning outdoor trips should be as enjoyable as the trip itself</em>. With so many beautiful destinations and routes in the world, we wanted to remove the stress of route planning, time management, and logistics — and replace it with inspiration, personalization, and simplicity.
        </p>
        <p className="mb-4 text-lg">
          Powered by advanced AI, our platform generates realistic multi-day hiking or biking routes based on your chosen destination, travel dates, and preferences. Whether you're looking for a relaxing two-day ride or a challenging mountain trek, AI Trip Planner tailors each itinerary to fit your style.
        </p>
        <p className="mb-4 text-lg">
          Each plan includes daily schedules, estimated distances, rest stops, meals, and activity suggestions — all optimized to help you make the most of your journey.
        </p>
        <p className="mb-6 text-lg">
          We're travelers too — and we believe in making nature more accessible, more spontaneous, and more enjoyable for everyone.
        </p>
        <p className="font-semibold text-gray-600">
          Start planning. Start exploring. Let the adventure begin.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
