'use client';
import Calendar from '@app/components/calendar/calendar';
import Sidebar from '@app/components/sidebar/sidebar';

const Home = () => {
  return (
    <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-black h-[calc(100vh-4rem)] w-full overflow-hidden">
      <div className="w-full md:w-2/5 h-1/2 md:h-full p-2 md:p-4 overflow-y-auto order-1 md:order-none">
        <Sidebar />
      </div>
      <div className="flex-grow p-2 md:p-4 md:pl-0 overflow-hidden flex flex-col h-3/5 md:h-full order-2 md:order-none">
        <Calendar />
      </div>
    </div>
  );
};

export default Home;
