import React, { FC, useState, useCallback, useEffect, useRef, useMemo } from 'react';

import {Row, fuzzyFilter, Filter, DebouncedInput } from '../util/react-table';

import {ChartLine } from '../util/component/chart';

import {
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'

import useWebSocket from 'react-use-websocket';

const useSingleton = (initializer:any) => {
  React.useState(initializer)
}

const IndexPage: FC = () => {

  const [data, setData] = React.useState<Row[]>([
    {
      id: "",
      display_name: "",
      type: "",
      spot: 0,
      old_price: 0,
      change: 0,
      chart: "1",
      button: "22"
    }
  ])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({"type": false})

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [globalFilter, setGlobalFilter] = React.useState('')

  const socketUrl = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';

  const {
    sendJsonMessage,
  } = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log('open');
      sendJsonMessage({
        "active_symbols": "full",
        "product_type": "basic"
      });
    },
    onMessage: function(event: WebSocketEventMap['message']) {
      const rows: Row[] = [];
      const obj = JSON.parse(event.data);
      // console.log('got data', obj);
      // get active data
      if(obj.active_symbols) {
        for(let i = 0; i < obj.active_symbols.length; i++) {
          let line = obj.active_symbols[i];
          // console.log(line);
          rows.push({
            id: line["symbol"],
            type: line["symbol_type"],
            display_name: line["display_name"],
            spot: line["spot"],
            change: line["spot"],
            old_price: 0,
            chart: '1',
            button: "2"
          });
          // call out to get the history of this symbol
          sendJsonMessage(
            {
              "ticks_history": line["symbol"],
              "adjust_start_time": 1,
              "count": 100,
              "end": "latest",
              "start": 1,
              "style": "ticks"
            }
          );
          sendJsonMessage(
            {
              "ticks": line["symbol"],
              "subscribe": 1
            }
          );
        }
        setData(rows);
      }

      // history
      if(obj.history) {
        const newData = [...data];

        newData.find((o, i) => {
          if (o.id === obj.echo_req.ticks_history) {
            newData[i].chart = JSON.stringify(obj.history);
            newData[i].old_price = obj.history.prices[0];
            newData[i].change = (newData[i].spot - newData[i].old_price) ;
            setData(newData);
            return true; // stop searching
          }
        });
      }

      if(obj.msg_type == 'tick') {
        const newData = [...data];

        let tmp = newData.find((o, i) => {
          if (o.id === obj.echo_req.ticks) {
            if(obj.tick) {
              newData[i].spot = obj.tick.quote;
              newData[i].change = (obj.tick.quote - newData[i].old_price);
              // market close 
            }else {
              newData[i].change = (newData[i].spot - newData[i].old_price) ;
            }
            setData(newData);
            return true; // stop searching
          }
        });

      }
    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => {
      console.log('should reconnect');
      return true;
    },
  });

  /*
     useSingleton(() => {
     sendJsonMessage({
     "active_symbols": "full",
     "product_type": "basic"
     });

     });
   */



  const columns = React.useMemo<ColumnDef<Row, any>[]>(
    () => [
      {
        header: 'Group',
        footer: props => props.column.id,
        columns: [
          {
            accessorKey: 'display_name',
            header: () => <span>Name</span>,
            footer: props => props.column.id,
          },
          {
            accessorKey: 'spot',
            header: 'Last price',
            footer: props => props.column.id,
          },
          {
            accessorKey: 'change',
            header: '24h change',
            footer: props => props.column.id,
          },
          {
            accessorKey: 'type',
            header: 'Type',
            enableHiding: true,
            footer: props => props.column.id,
          },
          {
            accessorKey: 'chart',
            sorting: false,
            header: '',
            enableColumnFilter: false,
            disableSortBy: true,
            maxWidth: 100,
            cell: ( props : any)  => (
              <>
                {props && <ChartLine idx={props.row.id} data={JSON.parse(props.row.getValue('chart')).prices} labels={JSON.parse(props.row.getValue('chart')).times} ></ChartLine>}
              </>
            ),
          },
          {
            accessorKey: 'button',
            header: '',
            sorting: false,
            disableSortBy: true,

            enableColumnFilter: false,
            cell: ( props : any)  => (
              <>
                <button className="btn-primary" onClick={ ()=> console.log(props) }>Trade</button>
              </>
            ),
          },
        ],
      },
    ],
    []
  )



  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
    autoResetAll: false
  })


  const unique = Array.from(new Set(data.map(item => {
    return item.type
  }))); 

  const body = (
    <>
      <table className="w-full sm:bg-white rounded-lg overflow-hidden sm:shadow-lg my-5">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr className=" flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0" key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <th className="p-3 text-left" key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : '',
                              onClick:  header.column.getCanSort()?header.column.getToggleSortingHandler():()=>{},
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ml-3 w-3 h-3 inline-block">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>,
                            desc: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ml-3 w-3 h-3 inline-block">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="flex-1 sm:flex-none">
          {table.getRowModel().rows.map(row => {
            return (
              <tr className="flex flex-col flex-no wrap sm:table-row mb-2 sm:mb-0" key={row.id}>
                {row.getVisibleCells().map(cell => {
                  return (
                    <td className="border-grey-light border hover:bg-gray-100 p-3" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>{table.getPrePaginationRowModel().rows.length} Rows</div>
    </>
  );
  return (
    <div className="container mx-auto mt-10">
      <button className="mr-3 btn-primary" onClick={()=>setGlobalFilter('')}>All</button>
      {
        unique.map((elementInArray, index) => (
          elementInArray && <button className="mr-3 btn-primary" key={index} onClick={()=>setGlobalFilter(elementInArray)}>{elementInArray}</button>
        ))
      }
      {body}
    </div>
  )
}

export default IndexPage;
