/* globals StripeTerminal */
/**
 * TerminalWrapper wraps the terminal and allows for users of this module to
 * log the event of requests to and from the Stripe SDK and event the github content
 */
class Terminal {
    constructor({
        onFetchConnectionToken,
        onReaderDisconnect,
        onConnectionStatusChange,
        onPaymentStatusChange,
        onUnexpectedReaderDisconnect,
        aquarium
    }) {
        this._aquarium = aquarium

        // Wrap our instance methods for tracing
        if (this._aquarium) {
            let instanceMethodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            for (let instanceMethodName of instanceMethodNames) {
                // Simple logic to detect handlers and constructor
                if (instanceMethodName === 'constructor' || instanceMethodName.startsWith('on')) {
                    continue
                }
                this[instanceMethodName] = this._aquarium.watchAction(this[instanceMethodName])
            }
            // wrap the handlers for tracing as well
            this._terminal = StripeTerminal.create({
                onFetchConnectionToken: this._aquarium.watchAction(this.onFetchConnectionToken(onFetchConnectionToken), 'event'),
                onReaderDisconnect: this._aquarium.watchAction(this.onReaderDisconnect(onReaderDisconnect), 'event'),
                onConnectionStatusChange: this._aquarium.watchAction(this.onConnectionStatusChange(onConnectionStatusChange), 'event'),
                onPaymentStatusChange: this._aquarium.watchAction(this.onPaymentStatusChange(onPaymentStatusChange), 'event'),
                onUnexpectedReaderDisconnect: this._aquarium.watchAction(this.onUnexpectedReaderDisconnect(onUnexpectedReaderDisconnect), 'event')
            })
        } else {
            this._terminal = StripeTerminal.create({
                onFetchConnectionToken: this.onFetchConnectionToken(onFetchConnectionToken),
                onReaderDisconnect: this.onReaderDisconnect(onReaderDisconnect),
                onConnectionStatusChange: this.onConnectionStatusChange(onConnectionStatusChange),
                onPaymentStatusChange: this.onPaymentStatusChange(onPaymentStatusChange),
                onUnexpectedReaderDisconnect: this.onUnexpectedReaderDisconnect(onUnexpectedReaderDisconnect)
            })
        }
    }
    /**
     * The following static methods are wrappers for the the event handlers coming out of the
     * Stripe POS SDK. These wrappers allow for static points in code to log and demonstrate
     * the events expected from the terminal SDK. The declared function in each of these
     * handlers is explicitly named the ame exact name as the named parameter of the handler
     * expected by the `createTerminal` factory method
     */
    onFetchConnectionToken (handler) {
        let onFetchConnectionToken = posDeviceId => handler(posDeviceId)
        return onFetchConnectionToken
    }
    onReaderDisconnect (handler) {
        let onReaderDisconnect = event => handler(event)
        return onReaderDisconnect
    }
    onConnectionStatusChange (handler) {
        let onConnectionStatusChange = (event) => handler(event)
        return onConnectionStatusChange
    }
    onPaymentStatusChange (handler) {
        let onPaymentStatusChange = (event) => handler(event)
        return onPaymentStatusChange
    }
    onUnexpectedReaderDisconnect (handler) {
        let onUnexpectedReaderDisconnect = (event) => handler(event)
        return onUnexpectedReaderDisconnect
    }
    /* END HANDLER WRAPPERS */

    /**
     * The following methods wrap the normal calls to the StripePos SDK for tracing/logging.
     * We could collapse these into a general wrapper function, but making explicit static
     * functions helps with readability of the SDK usage
     */
    async disconnect() {
        const result = await this._terminal.disconnect()
        return result
    }

    async connectReader(reader) {
        const result = await this._terminal.connectReader(reader)
        return result
    }

    async discoverReaders () {
        const result = await this._terminal.discoverReaders()
        return result
    }

    async clearReaderDisplay() {
        const result = await this._terminal.clearReaderDisplay()
        return result
    }

    async setReaderDisplay(options) {
        const result = await this._terminal.setReaderDisplay(options)
        return result
    }

    async attachSource(intent) {
        const result = await this._terminal.attachSource(intent)
        return result
    }

    async confirmPaymentIntent(attachedIntent) {
        const result = await this._terminal.confirmPaymentIntent(attachedIntent)
        return result
    }

    /** END POS SDK WRAPPERS */
}

/**
 * TerminalFactory is  factory class for TerminalWrapper to enforce
 * singleton creation of a wrapped Terminal object
 */
class TerminalFactory {
    static GetOrCreateTerminal({
        onFetchConnectionToken,
        onReaderDisconnect,
        onConnectionStatusChange,
        onPaymentStatusChange,
        onUnexpectedReaderDisconnect,
        aquarium}) {

        if (this._terminal) {
            // there's only one terminal in any POS app
            return this._terminal
        }
        this._terminal = new Terminal({
            onFetchConnectionToken,
            onReaderDisconnect,
            onConnectionStatusChange,
            onPaymentStatusChange,
            onUnexpectedReaderDisconnect,
            aquarium
        })
        return this._terminal
    }
}

export default TerminalFactory
