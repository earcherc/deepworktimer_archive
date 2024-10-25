import classNames from 'classnames';
import { type FC } from 'react';
import { Tooltip } from 'react-tooltip';

interface SessionCounterProps {
  target: number;
  completed: number;
  isActive: boolean;
  isBreak: boolean;
  onReset: () => void;
  onClick: () => void;
}

const SessionCounter: FC<SessionCounterProps> = ({ target, completed, isActive, isBreak, onReset, onClick }) => {
  return (
    <>
      <h2 className='text-xl text-gray-900 text-center font-semibold mb-6'>
        Streak Counter
      </h2>
      <div
        className='flex items-center mb-6'
        data-tooltip-id="session-counter-tooltip"
        data-tooltip-content={`Session Counter: ${completed}/${target} completed`}
      >
        <div className="flex items-center flex-wrap gap-3 w-full justify-center">
          {[...Array(target)].map((val, i) => (
            <div
              key={val + i}
              className={classNames('w-4 h-4 rounded-full transition-colors duration-200', {
                'bg-gray-300': i >= completed && !(i === completed && isActive),
                'bg-blue-500': i < completed,
                'relative overflow-hidden bg-gray-300': i === completed && isActive,
              })}
            >
              {i === completed && isActive && !isBreak && (
                <div
                  className="absolute inset-0 bg-blue-500"
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          className={classNames(
            "flex-1 text-gray-900 rounded-lg px-5 py-2.5 font-medium transition-all duration-200",
            !isActive
              ? "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              : "bg-gray-100 opacity-50 cursor-not-allowed"
          )}
          onClick={!isActive ? onClick : undefined}
        >
          Edit
        </button>
        {completed > 0 && (
          <button
            className={classNames(
              "flex-1 rounded-lg px-5 py-2.5 font-medium transition-all duration-200 text-gray-600",
              !isActive
                ? "border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:bg-red-100"
                : "border border-gray-200 opacity-50 cursor-not-allowed"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!isActive) {
                onReset();
              }
            }}
          >
            Reset
          </button>
        )}
      </div>

      <Tooltip
        id="session-counter-tooltip"
        delayShow={800}
        place="bottom"
        className='z-50'
      />
    </>
  );
};

export default SessionCounter;
