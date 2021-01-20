import { EventEmitter } from 'events'
import { ok, Result, ResultAsync, Queue, unwrapResultOfResult, logger } from '../../core/utils'
import { InfraNotAvailableError, OtherError } from '../shared'
import { EventStore, EventStoreHistoryFilters, EventStoreTransactionArgs } from './EventStore'
import { StoredEvent } from './StoredEvent'

export abstract class BaseEventStore implements EventStore {
  private queue: Queue

  private eventEmitter: EventEmitter

  constructor() {
    this.queue = new Queue()
    this.eventEmitter = new EventEmitter()
  }

  protected abstract persistEvents(events: StoredEvent[]): ResultAsync<null, InfraNotAvailableError>

  public abstract loadHistory(
    filters?: EventStoreHistoryFilters
  ): ResultAsync<StoredEvent[], InfraNotAvailableError>

  publish(event: StoredEvent): ResultAsync<null, InfraNotAvailableError> {
    const ticket = this.queue.push(async () => await this._persistAndPublish([event]))

    return ResultAsync.fromPromise(ticket, (e: Error) => {
      logger.error(e)
      return new InfraNotAvailableError()
    }).andThen(unwrapResultOfResult)
  }

  subscribe<T extends StoredEvent>(eventType: T['type'], callback: (event: T) => any) {
    this.eventEmitter.on(eventType, callback)
  }

  transaction<T>(
    fn: (args: EventStoreTransactionArgs) => T
  ): ResultAsync<T, InfraNotAvailableError | OtherError> {
    const ticket: Promise<Result<T, InfraNotAvailableError>> = this.queue.push(async () => {
      const eventsToEmit: StoredEvent[] = []

      const callbackResult = await fn({
        loadHistory: (filters) => {
          return this.loadHistory(filters)
        },
        publish: (event: StoredEvent) => {
          eventsToEmit.push(event)
        },
      })
      return eventsToEmit.length
        ? await this._persistAndPublish(eventsToEmit).map(() => callbackResult)
        : ok(callbackResult)
    })

    return ResultAsync.fromPromise(ticket, (e: any) => new OtherError(e.message)).andThen(
      (res) => res
    )
  }

  private _emitEvent(event: StoredEvent) {
    logger.info(`[${event.type}] ${event.aggregateId}`)
    this.eventEmitter.emit(event.type, event)
  }

  private _persistAndPublish = (events: StoredEvent[]) => {
    return this.persistEvents(events).andThen(() => {
      events.forEach(this._emitEvent.bind(this))
      return ok<null, InfraNotAvailableError>(null)
    })
  }
}
