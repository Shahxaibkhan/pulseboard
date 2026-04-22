"use client"

import * as React from "react"
import { type ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

interface State { toasts: ToasterToast[] }

let count = 0
function genId() { return `toast-${++count}` }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function addToRemoveQueue(toastId: string, dispatch: React.Dispatch<Action>) {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case "UPDATE_TOAST":
      return { ...state, toasts: state.toasts.map(t => t.id === action.toast.id ? { ...t, ...action.toast } : t) }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) addToRemoveQueue(toastId, dispatch)
      else state.toasts.forEach(t => addToRemoveQueue(t.id, dispatch))
      return { ...state, toasts: state.toasts.map(t => (!toastId || t.id === toastId) ? { ...t, open: false } : t) }
    }
    case "REMOVE_TOAST":
      return { ...state, toasts: action.toastId ? state.toasts.filter(t => t.id !== action.toastId) : [] }
  }
}

let dispatch: React.Dispatch<Action> = () => {}

const listeners: Array<React.Dispatch<Action>> = []
let memoryState: State = { toasts: [] }

function dispatchGlobal(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach(l => l(action))
}

function toast(props: Omit<ToasterToast, "id">) {
  const id = genId()
  dispatchGlobal({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dispatchGlobal({ type: "DISMISS_TOAST", toastId: id }) } } })
  return { id, dismiss: () => dispatchGlobal({ type: "DISMISS_TOAST", toastId: id }) }
}

function useToast() {
  const [state, localDispatch] = React.useReducer(reducer, memoryState)
  dispatch = localDispatch

  React.useEffect(() => {
    listeners.push(localDispatch)
    return () => { const idx = listeners.indexOf(localDispatch); if (idx > -1) listeners.splice(idx, 1) }
  }, [localDispatch])

  return { ...state, toast, dismiss: (id?: string) => dispatchGlobal({ type: "DISMISS_TOAST", toastId: id }) }
}

export { useToast, toast }
