import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  ScriptableContext,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);


interface Props {
  data: [];
  labels: [];
  idx: string;
}

export const ChartLine = function ( prop:Props) {
  var highest:number, lowest:number = -1;
  const customRadius = function ( context : ScriptableContext<"line">)
  {
    let index = context.dataIndex;
    if(index == 0 ) {
      highest = -1;
      lowest = -1;
    }
    let value = context.dataset.data[ index ] ?? 0;

    let listData:any = context.dataset.data ?? [];
    if(listData.length){

      if( value >= Math.max(...listData) && highest == -1) {
        highest = index;
        return 5;
      } 
      if( value <= Math.min(...listData) && lowest == -1) {
        lowest = index
        return 5;
      } 
    }
    return 0;
  }

  const options = {
    maintainAspectRatio: true,
    responsive: false,
    animation: {
      duration: 0
    },
    elements: {
      point: {
        radius : customRadius,
        display: true
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    }
  };

  const labels = prop.labels;

  if(prop.data && labels) {

    const data = {
      labels,
      datasets: [
        {
          fill: true,
          data: prop.data,
          backgroundColor: (context: ScriptableContext<"line">) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, "rgba(250,174,50,1)");
            gradient.addColorStop(1, "rgba(250,174,50,0)");
            return gradient;
          },
          borderColor: "rgba(75,192,192,1)",
          pointBackgroundColor: function(context: ScriptableContext<"line">) {
            let index = context.dataIndex;
            let value : any = context.dataset.data[ index ] ?? 0;
            let listData:any = context.dataset.data ?? [];
            if(listData.length){
              if( value >= Math.max(...listData)) {
                return 'green';
              } 
              if( value <= Math.min(...listData)) {
                return 'red';
              } 
            }
            return 'inherit';
          }

        },
      ],
    };
    return <Line width={100} height={50} datasetIdKey={"hello_" + prop.idx} key={prop.idx} options={options} data={data} />;
  } else {
    return (
      <>
        <span>No data found</span>
      </>
    )
  }

}

