import React from 'react';
import {
  Column,
  Table,
  FilterFn,
} from '@tanstack/react-table'

import {
  RankingInfo,
  rankItem,
} from '@tanstack/match-sorter-utils'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}


export interface Row {
  id: string;
  display_name: string;
  type: string;
  spot: number;
  old_price: number;
  change: number;
  chart?: string;
  button?: string;
}

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}


export const Filter = function({
  column,
  table,
}: {
  column: Column<any, unknown>
  table: Table<any>
}) {
  const firstValue = table
  .getPreFilteredRowModel()
  .flatRows[0]?.getValue(column.id)

  // console.log('column', column)
  const columnFilterValue = column.getFilterValue()

  const sortedUniqueValues = React.useMemo(
    () =>
      typeof firstValue === 'number'
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
        [column.getFacetedUniqueValues()]
  )


  return column.columnDef && !column.columnDef.enableColumnFilter? (<></>):
    (typeof firstValue === 'number' ? (
      <div>
      <div className="flex space-x-2">
      <DebouncedInput
      type="number"
      min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
      max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
      value={(columnFilterValue as [number, number])?.[0] ?? ''}
      onChange={value =>
        column.setFilterValue((old: [number, number]) => [value, old?.[1]])
      }
      placeholder={`Min ${
        column.getFacetedMinMaxValues()?.[0]
          ? `(${column.getFacetedMinMaxValues()?.[0]})`
          : ''
      }`}
      className="w-full border shadow rounded"
      />
      <DebouncedInput
      type="number"
      min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
      max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
      value={(columnFilterValue as [number, number])?.[1] ?? ''}
      onChange={value =>
        column.setFilterValue((old: [number, number]) => [old?.[0], value])
      }
      placeholder={`Max ${
        column.getFacetedMinMaxValues()?.[1]
          ? `(${column.getFacetedMinMaxValues()?.[1]})`
          : ''
      }`}
      className="w-full border shadow rounded"
      />
      </div>
      <div className="h-1" />
      </div>
  ) : (
  <>
  <datalist id={column.id + 'list'}>
  {sortedUniqueValues.slice(0, 5000).map((value: any) => (
    <option value={value} key={value} />
  ))}
  </datalist>
  <DebouncedInput
  type="text"
  value={(columnFilterValue ?? '') as string}
  onChange={value => column.setFilterValue(value)}
  placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
  className="border shadow rounded"
  list={column.id + 'list'}
  />
  <div className="h-1" />
  </>
  ))
}

// A debounced input react component
export const DebouncedInput = function ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <input {...props} value={value} onChange={e => setValue(e.target.value)} />
  )


  // return <DataGrid columns={columns} rows={rows} />;
}
