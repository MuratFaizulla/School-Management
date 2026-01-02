"use client";

import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Пример данных - в реальности нужно получать из базы данных
const data = [
  {
    name: "Янв",
    events: 12,
    feedbacks: 8,
  },
  {
    name: "Фев",
    events: 15,
    feedbacks: 12,
  },
  {
    name: "Мар", 
    events: 18,
    feedbacks: 15,
  },
  {
    name: "Апр",
    events: 22,
    feedbacks: 18,
  },
  {
    name: "Май",
    events: 20,
    feedbacks: 16,
  },
  {
    name: "Июн",
    events: 25,
    feedbacks: 22,
  },
  {
    name: "Июл",
    events: 28,
    feedbacks: 25,
  },
  {
    name: "Авг",
    events: 24,
    feedbacks: 20,
  },
  {
    name: "Сен",
    events: 26,
    feedbacks: 23,
  },
  {
    name: "Окт",
    events: 30,
    feedbacks: 27,
  },
  {
    name: "Ноя",
    events: 32,
    feedbacks: 29,
  },
  {
    name: "Дек",
    events: 28,
    feedbacks: 26,
  },
];

const FeedbackChart = () => {
  // Вычисляем процент заполненности
  const completionRate = data[data.length - 1] 
    ? Math.round((data[data.length - 1].feedbacks / data[data.length - 1].events) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-semibold">Статистика контроля</h1>
          <p className="text-sm text-gray-500">
            Заполненность листов: <span className="font-medium text-blue-600">{completionRate}%</span>
          </p>
        </div>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis 
            axisLine={false} 
            tick={{ fill: "#d1d5db" }} 
            tickLine={false}  
            tickMargin={20}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              value, 
              name === 'events' ? 'События' : 'Листы наблюдения'
            ]}
            labelFormatter={(label: string) => `Месяц: ${label}`}
          />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
            formatter={(value: string) => 
              value === 'events' ? 'События контроля' : 'Листы наблюдения'
            }
          />
          <Line
            type="monotone"
            dataKey="events"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: "#3B82F6", r: 4 }}
            name="events"
          />
          <Line 
            type="monotone" 
            dataKey="feedbacks" 
            stroke="#10B981"
            strokeWidth={3}
            dot={{ fill: "#10B981", r: 4 }}
            name="feedbacks"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeedbackChart;